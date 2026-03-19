import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendPaymentReceiptEmail } from '../../../lib/email';
import { stripe } from '../../../lib/stripe';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature || '', process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const amount = session.amount_total || 0;
      const plan = session.metadata?.plan || 'Unknown';
      const userId = session.metadata?.userId;
      const stripeCustomerId = session.customer as string | null || null;

      // Only map current active plans — deprecated plan names fall back to 'free'
      const planMap: Record<string, string> = {
        underground: 'underground',
        collective:  'collective',
        label:       'label',
      };
      const mappedPlan = planMap[plan] || 'free';

      const subscriptionData = {
        plan: mappedPlan,
        stripeCustomerId,
        stripeSubscriptionId: session.subscription as string || null,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
      };

      // Update user subscription — prefer userId from metadata (most reliable)
      if (userId && userId.trim() !== '') {
        try {
          await prisma.user.update({
            where: { id: userId },
            data: subscriptionData,
          });
          console.log(`Updated user ${userId} to plan ${mappedPlan}`);
          if (customerEmail) {
            await sendPaymentReceiptEmail(customerEmail, amount, plan);
          }
        } catch (err) {
          console.error('Failed to update user by ID, falling back to email:', err);
          if (customerEmail) {
            await sendPaymentReceiptEmail(customerEmail, amount, plan);
            await prisma.user.upsert({
              where: { email: customerEmail },
              update: subscriptionData,
              create: { email: customerEmail, ...subscriptionData },
            });
          }
        }
      } else if (customerEmail) {
        // No userId in metadata (guest checkout) — only update existing users, never create
        await sendPaymentReceiptEmail(customerEmail, amount, plan);
        if (plan && plan !== 'Unknown') {
          const existingUser = await prisma.user.findUnique({ where: { email: customerEmail } });
          if (existingUser) {
            await prisma.user.update({
              where: { email: customerEmail },
              data: subscriptionData,
            });
          } else {
            console.error(`Guest checkout for unknown email ${customerEmail} — user must register first`);
          }
        }
      } else {
        console.error('No userId or email found in checkout session metadata');
      }

      // Handle storage upgrades — use userId (verified at checkout), never trust email from metadata
      if (session.metadata?.type === 'storage_upgrade') {
        const storageUserId = session.metadata?.userId;
        const storageGB = 50;
        if (storageUserId) {
          const storageUser = await prisma.user.update({
            where: { id: storageUserId },
            data: { storageLimit: { increment: storageGB } },
          });
          if (storageUser.email) {
            await sendEmail({
              to: storageUser.email,
              subject: 'Storage Upgraded — Agentbot',
              html: `
                <h1>Storage Upgrade Active</h1>
                <p>Your account now has ${storageGB}GB of additional storage.</p>
                <p>Visit your files: <a href="https://agentbot.raveculture.xyz/dashboard/files">Dashboard</a></p>
                <hr /><p>Best,<br>The Agentbot Team</p>
              `,
            });
          }
        } else {
          console.error('Storage upgrade missing userId in metadata — cannot apply');
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      const amount = invoice.amount_paid;
      const plan = invoice.metadata?.plan || 'Subscription';
      if (customerEmail) {
        await sendPaymentReceiptEmail(customerEmail, amount, plan);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      const customerEmail = subscription.customer_email;
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: 'Your Agentbot subscription is active!',
          html: `
            <h1>Subscription Confirmed</h1>
            <p>Your subscription has been successfully activated.</p>
            <p>Visit your dashboard: <a href="https://agentbot.raveculture.xyz/dashboard">Dashboard</a></p>
            <hr /><p>Best,<br>The Agentbot Team</p>
          `,
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
