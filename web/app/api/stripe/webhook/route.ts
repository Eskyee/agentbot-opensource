import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendPaymentReceiptEmail } from '../../../lib/email';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    event = JSON.parse(body);
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook parsing failed' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const amount = session.amount_total || 0;
      const plan = session.metadata?.plan || 'Unknown';

      if (customerEmail) {
        await sendPaymentReceiptEmail(customerEmail, amount, plan);
      }

      if (session.metadata?.type === 'storage_upgrade') {
        const userEmail = session.metadata?.userEmail;
        const storageGB = 50;

        if (userEmail) {
          await prisma.user.update({
            where: { email: userEmail },
            data: {
              storageLimit: { increment: storageGB }
            }
          });

          await sendEmail({
            to: userEmail,
            subject: 'Upgraded to Pro Plan! - Agentbot',
            html: `
              <h1>Pro Plan Activated</h1>
              <p>Your Pro Plan is now active with 50 GB of additional storage.</p>
              <p>Visit your files: <a href="https://agentbot.raveculture.xyz/dashboard/files">https://agentbot.raveculture.xyz/dashboard/files</a></p>
              <hr />
              <p>Best,<br>The Agentbot Team</p>
            `,
          });
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
      const subscription = event.data.object;
      const customerEmail = subscription.customer_email;

      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: 'Your Agentbot subscription is active!',
          html: `
            <h1>Subscription Confirmed</h1>
            <p>Your subscription has been successfully activated.</p>
            <p>Visit your dashboard: <a href="https://agentbot.raveculture.xyz/dashboard">https://agentbot.raveculture.xyz/dashboard</a></p>
            <hr />
            <p>Best,<br>The Agentbot Team</p>
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
