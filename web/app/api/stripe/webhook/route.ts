import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendEmail, sendPaymentReceiptEmail } from '../../../lib/email';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    console.error('Missing Stripe configuration');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(
      body,
      signature || '',
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook parsing failed' }, { status: 400 });
  }

  // Process the event based on type
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const amount = session.amount_total || 0;
        const plan = session.metadata?.plan || 'Unknown';
        const userId = session.metadata?.userId;

        // Map plan names to database values
        const planMap: Record<string, string> = {
          'starter': 'starter',
          'pro': 'pro', 
          'scale': 'scale',
          'enterprise': 'enterprise',
          'white_glove': 'white_glove'
        };
        const mappedPlan = planMap[plan] || 'free';

        console.log(`Processing checkout session: ${session.id} for plan ${mappedPlan}`);

        // Update user subscription using user ID if available, otherwise fallback to email
        if (userId && userId.trim() !== '') {
          // Prefer using user ID from metadata (more reliable)
          try {
            await prisma.user.update({
              where: { id: parseInt(userId) },
              data: {
                plan: mappedPlan,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string || null,
                subscription_status: 'active',
                subscription_start_date: new Date()
              }
            });
            console.log(`✓ Updated user ${userId} with plan ${mappedPlan}`);
            
            // Trigger deployment on backend
            try {
              const backendUrl = process.env.BACKEND_API_URL || 'http://agentbot-api:3001';
              const deploymentRes = await fetch(
                `${backendUrl}/api/subscriptions/deploy`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
                  },
                  body: JSON.stringify({
                    userId,
                    plan: mappedPlan,
                    email: customerEmail,
                    stripeSubscriptionId: session.subscription
                  })
                }
              );

              if (deploymentRes.ok) {
                const deployment = await deploymentRes.json();
                console.log(`✓ Deployment triggered successfully:`, deployment);
              } else {
                const error = await deploymentRes.text();
                console.error(`✗ Deployment failed: ${deploymentRes.status} - ${error}`);
              }
            } catch (deployErr) {
              console.error('✗ Failed to trigger deployment:', deployErr);
            }
            
            // Send receipt email if we have email
            if (customerEmail) {
              try {
                await sendPaymentReceiptEmail(customerEmail, amount, plan);
                console.log(`✓ Receipt email sent to ${customerEmail}`);
              } catch (emailErr) {
                console.error('✗ Failed to send receipt email:', emailErr);
              }
            }
          } catch (err) {
            console.error('✗ Failed to update user by ID, falling back to email:', err);
            // Fall through to email-based update
            if (customerEmail) {
              try {
                await sendPaymentReceiptEmail(customerEmail, amount, plan);
              } catch (emailErr) {
                console.error('Failed to send receipt email:', emailErr);
              }
              
              if (plan && plan !== 'Unknown') {
                await prisma.user.upsert({
                  where: { email: customerEmail },
                  update: {
                    plan: mappedPlan,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string || null,
                    subscription_status: 'active',
                    subscription_start_date: new Date()
                  },
                  create: {
                    email: customerEmail,
                    plan: mappedPlan,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string || null,
                    subscription_status: 'active',
                    subscription_start_date: new Date()
                  }
                });
              }
            }
          }
        } else if (customerEmail) {
          // Fallback to email lookup if userId not available
          try {
            await sendPaymentReceiptEmail(customerEmail, amount, plan);
          } catch (emailErr) {
            console.error('Failed to send receipt email:', emailErr);
          }
          
          if (plan && plan !== 'Unknown') {
            await prisma.user.upsert({
              where: { email: customerEmail },
              update: {
                plan: mappedPlan,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string || null,
                subscription_status: 'active',
                subscription_start_date: new Date()
              },
              create: {
                email: customerEmail,
                plan: mappedPlan,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string || null,
                subscription_status: 'active',
                subscription_start_date: new Date()
              }
            });
          }
        } else {
          console.error('No userId or email found in checkout session metadata');
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const customerEmail = invoice.customer_email;
        const amount = invoice.amount_paid;
        const plan = invoice.metadata?.plan || 'Subscription';

        if (customerEmail) {
          try {
            await sendPaymentReceiptEmail(customerEmail, amount, plan);
          } catch (emailErr) {
            console.error('Failed to send payment receipt:', emailErr);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerEmail = subscription.customer_email;

        if (customerEmail) {
          try {
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
          } catch (emailErr) {
            console.error('Failed to send subscription confirmation:', emailErr);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        // Find user by Stripe subscription ID and mark as cancelled
        const user = await prisma.user.findFirst({
          where: { stripe_subscription_id: subscription.id }
        });
        
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'free',
              subscription_status: 'cancelled',
              subscription_end_date: new Date()
            }
          });

          try {
            if (user.email) {
              await sendEmail({
                to: user.email,
                subject: 'Your AgentBot subscription has been cancelled',
                html: `
                  <h1>Subscription Cancelled</h1>
                  <p>Your subscription has been cancelled. You can resubscribe anytime.</p>
                  <p>Visit us: <a href="https://agentbot.raveculture.xyz/pricing">https://agentbot.raveculture.xyz/pricing</a></p>
                  <hr />
                  <p>Best,<br>The Agentbot Team</p>
                `,
              });
            }
          } catch (emailErr) {
            console.error('Failed to send cancellation email:', emailErr);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
