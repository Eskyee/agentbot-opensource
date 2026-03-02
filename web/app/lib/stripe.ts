import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export async function createCheckoutSession(
  priceId: string,
  customerId?: string,
  metadata?: Record<string, string>
) {
  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata,
    }

    if (customerId) {
      sessionParams.customer = customerId
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return session
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    throw error
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Failed to retrieve subscription:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.del(subscriptionId)
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    throw error
  }
}

export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const items = subscription.items.data

    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: items[0].id,
          price: priceId,
        },
      ],
    })
  } catch (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }
}

export async function retrieveCustomer(customerId: string) {
  try {
    return await stripe.customers.retrieve(customerId)
  } catch (error) {
    console.error('Failed to retrieve customer:', error)
    throw error
  }
}

export async function createCustomer(email: string, name?: string) {
  try {
    return await stripe.customers.create({
      email,
      name,
    })
  } catch (error) {
    console.error('Failed to create customer:', error)
    throw error
  }
}
