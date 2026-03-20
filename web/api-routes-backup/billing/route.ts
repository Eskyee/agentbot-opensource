export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    priceId: process.env.STRIPE_PRICE_STARTER,
    dailyUnits: 600,
    features: ['1 AI Agent', '2GB RAM', 'Telegram', 'Basic skills']
  },
  pro: {
    name: 'Pro',
    price: 39,
    priceId: process.env.STRIPE_PRICE_PRO,
    dailyUnits: 1000,
    features: ['1 AI Agent', '4GB RAM', 'All channels', 'All skills', 'Priority support']
  },
  scale: {
    name: 'Scale',
    price: 79,
    priceId: process.env.STRIPE_PRICE_SCALE,
    dailyUnits: 2500,
    features: ['3 AI Agents', '8GB RAM', 'All channels', 'All skills', 'Analytics']
  }
};

export async function POST(request: NextRequest) {
  try {
    // Auth required for all billing actions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, plan, apiKey, provider } = body;

    // Always use session userId — never trust client-supplied userId
    const userId = session.user.id;

    if (action === 'create-checkout') {
      const selectedPlan = PLANS[plan as keyof typeof PLANS];
      if (!selectedPlan) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: selectedPlan.priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
        metadata: {
          userId,
          plan,
          type: 'agent-subscription'
        }
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    if (action === 'enable-byok') {
      if (!apiKey || !provider) {
        return NextResponse.json({ error: 'API key and provider required' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `BYOK enabled with ${provider}. You'll pay ${provider} directly for AI usage.`
      });
    }

    if (action === 'disable-byok') {
      return NextResponse.json({
        success: true,
        message: 'BYOK disabled. Using platform credits.'
      });
    }

    if (action === 'get-usage') {
      return NextResponse.json({
        dailyUnits: 600,
        used: 245,
        remaining: 355,
        resetsAt: 'midnight UTC'
      });
    }

    if (action === 'buy-credits') {
      const creditPacks: Record<string, number> = {
        '50': 5,
        '200': 15,
        '500': 30
      };

      const packSize = body.pack || body.amount;
      const credits = creditPacks[packSize as string];
      if (!credits) {
        return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        credits: credits,
        price: `$${credits}`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Billing error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Auth required — users can only see their own billing info
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, referralCredits: true }
    });

    return NextResponse.json({
      plans: PLANS,
      currentPlan: user?.plan || 'free',
      subscriptionStatus: user?.subscriptionStatus || 'inactive',
      byokEnabled: false,
      usage: {
        dailyUnits: 600,
        used: 245,
        remaining: 355
      }
    });
  } catch (error) {
    console.error('Billing fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 });
  }
}
