import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma';
import { getTrialCountdown } from '@/app/lib/trial-utils'
import { redis } from '@/app/lib/redis';


const CACHE_TTL = 30; // 30 seconds

const PLANS = {
  solo: {
    name: 'Solo',
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER,
    dailyUnits: 600,
    memory: '2g',
    cpus: '1',
    maxAgents: 1,
    features: ['1 AI Agent', '2GB RAM', 'Telegram', 'Basic skills']
  },
  collective: {
    name: 'Collective',
    price: 69,
    priceId: process.env.STRIPE_PRICE_PRO,
    dailyUnits: 1000,
    memory: '4g',
    cpus: '2',
    maxAgents: 3,
    features: ['3 AI Agents', '4GB RAM', 'All channels', 'All skills', 'Priority support']
  },
  label: {
    name: 'Label',
    price: 149,
    priceId: process.env.STRIPE_PRICE_SCALE,
    dailyUnits: 2500,
    memory: '8g',
    cpus: '4',
    maxAgents: 10,
    features: ['10 AI Agents', '8GB RAM', 'All channels', 'All skills', 'Analytics']
  },
  network: {
    name: 'Network',
    price: 499,
    priceId: process.env.STRIPE_PRICE_NETWORK,
    dailyUnits: 10000,
    memory: '16g',
    cpus: '4',
    maxAgents: 999999,
    features: ['Unlimited Agents', '16GB RAM', 'All channels', 'All skills', 'Dedicated support']
  }
};

export async function POST(request: NextRequest) {
  try {
    // Auth required for all billing actions
    const session = await getAuthSession();
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      const planMap: Record<string, keyof typeof PLANS> = {
        starter: 'solo', pro: 'collective', scale: 'label',
        free: 'solo',
      };
      const planKey = planMap[user?.plan || ''] || (user?.plan as keyof typeof PLANS) || 'solo';
      const planConfig = PLANS[planKey] || PLANS.solo;
      return NextResponse.json({
        dailyUnits: planConfig.dailyUnits,
        used: 0,
        remaining: planConfig.dailyUnits,
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
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = `billing:${session.user.id}`;

  try {
    // Try cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return NextResponse.json(cached);
      } catch (cacheError) {
        console.warn('[Billing] Cache read failed:', cacheError);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, referralCredits: true, trialEndsAt: true }
    });

    const countdown = getTrialCountdown(user?.trialEndsAt)

    // Map legacy plan names to canonical names
    const planMap: Record<string, keyof typeof PLANS> = {
      starter: 'solo', pro: 'collective', scale: 'label',
      free: 'solo',
    };
    const planKey = planMap[user?.plan || ''] || (user?.plan as keyof typeof PLANS) || 'solo';
    const planConfig = PLANS[planKey] || PLANS.solo;

    const responseData = {
      plans: PLANS,
      currentPlan: user?.plan || 'free',
      subscriptionStatus: user?.subscriptionStatus || 'inactive',
      trial: countdown
        ? {
            expired: countdown.expired,
            daysLeft: countdown.daysLeft,
            endsAt: countdown.endsAt,
          }
        : null,
      byokEnabled: false,
      usage: {
        dailyUnits: planConfig.dailyUnits,
        used: 0,
        remaining: planConfig.dailyUnits
      }
    };

    // Save to cache
    if (redis) {
      try {
        void redis.set(cacheKey, responseData, { ex: CACHE_TTL });
      } catch (cacheWriteError) {
        console.warn('[Billing] Cache write failed:', cacheWriteError);
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Billing fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 });
  }
}
