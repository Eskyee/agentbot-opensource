import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic';

interface Fan {
  id: string;
  userId?: string;
  name: string;
  email: string;
  wallet?: string;
  telegram?: string;
  source: 'telegram' | 'discord' | 'website' | 'event' | 'referral';
  segments: string[];
  lifetimeValue: number;
  lastActivity: number;
  engagement: 'low' | 'medium' | 'high';
  purchases: { date: string; item: string; amount: number }[];
  events: { name: string; date: string; attended: boolean }[];
}

const VALID_SOURCES: Fan['source'][] = ['telegram', 'discord', 'website', 'event', 'referral'];
const VALID_SEGMENTS = ['vinyl', 'DJ', 'collector', 'supporter', 'producer', 'industry', 'casual'];
const VALID_ENGAGEMENT: Fan['engagement'][] = ['low', 'medium', 'high'];
const VALID_CAMPAIGN_TYPES = ['email', 'telegram', 'discord'];

function sanitizeString(str: string | undefined, maxLen = 100): string {
  if (!str) return '';
  return str.slice(0, maxLen).replace(/[<>]/g, '');
}

function sanitizeSegments(segments: unknown): string[] {
  if (!Array.isArray(segments)) return ['casual'];
  return segments
    .filter((s): s is string => typeof s === 'string')
    .filter(s => VALID_SEGMENTS.includes(s.toLowerCase()))
    .slice(0, 5);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const fans = new Map<string, Fan>();

const initialFans: Fan[] = [
  { id: 'f1', name: 'Techno Tom', email: 'tom@email.com', telegram: '@technotom', source: 'telegram', segments: ['vinyl', 'DJ'], lifetimeValue: 500, lastActivity: Date.now() - 86400000, engagement: 'high', purchases: [{ date: '2025-12-01', item: 'EP Release', amount: 15 }, { date: '2026-01-15', item: 'Merch Pack', amount: 45 }], events: [{ name: 'Basement Sessions', date: '2025-11-20', attended: true }] },
  { id: 'f2', name: 'Rave Rachel', email: 'rachel@email.com', telegram: '@raverachel', source: 'discord', segments: ['collector', 'supporter'], lifetimeValue: 1200, lastActivity: Date.now() - 172800000, engagement: 'high', purchases: [{ date: '2025-10-15', item: 'Album', amount: 20 }, { date: '2025-12-20', item: 'Ticket', amount: 35 }, { date: '2026-01-01', item: 'Merch', amount: 60 }], events: [{ name: 'NYE Rave', date: '2025-12-31', attended: true }] },
  { id: 'f3', name: 'Chill Charlie', email: 'charlie@email.com', source: 'website', segments: ['casual'], lifetimeValue: 25, lastActivity: Date.now() - 604800000, engagement: 'low', purchases: [{ date: '2025-08-10', item: 'Single', amount: 5 }], events: [] },
  { id: 'f4', name: 'Producer Pete', email: 'pete@email.com', telegram: '@producerpete', source: 'event', segments: ['producer', 'industry'], lifetimeValue: 2000, lastActivity: Date.now() - 43200000, engagement: 'high', purchases: [{ date: '2025-09-01', item: 'Sample Pack', amount: 50 }, { date: '2025-11-01', item: 'Course', amount: 150 }, { date: '2026-02-01', item: 'Mentorship', amount: 500 }], events: [{ name: 'A&R Workshop', date: '2026-01-20', attended: true }] },
  { id: 'f5', name: 'Vinyl Vicky', email: 'vicky@email.com', telegram: '@vinylvicky', source: 'telegram', segments: ['vinyl', 'collector'], lifetimeValue: 800, lastActivity: Date.now() - 259200000, engagement: 'medium', purchases: [{ date: '2025-07-15', item: '12" Single', amount: 25 }, { date: '2025-10-01', item: 'LP', amount: 40 }], events: [{ name: 'Record Fair', date: '2025-09-15', attended: true }] },
];

initialFans.forEach(f => fans.set(f.id, f));

export async function POST(request: NextRequest) {
  try {
    // Auth required in production, optional in demo mode
    const isDemoMode = process.env.SKIP_AUTH_FOR_DEMO === 'true';
    if (!isDemoMode) {
      const session = await getAuthSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { action, ...data } = body;

    // Validate action
    const VALID_ACTIONS = ['add-fan', 'segment', 'predict-churn', 'campaign', 'analytics'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'add-fan') {
      // Validate required fields
      if (!data.name || typeof data.name !== 'string') {
        return NextResponse.json({ error: 'Valid name required' }, { status: 400 });
      }
      if (data.email && !validateEmail(data.email)) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
      }

      const id = 'f_' + Math.random().toString(36).substr(2, 9);
      const source = VALID_SOURCES.includes(data.source) ? data.source : 'website';
      
      const fan: Fan = {
        id,
        name: sanitizeString(data.name, 50),
        email: sanitizeString(data.email, 100),
        telegram: sanitizeString(data.telegram, 50),
        wallet: data.wallet ? sanitizeString(data.wallet, 42) : undefined,
        source,
        segments: sanitizeSegments(data.segments),
        lifetimeValue: 0,
        lastActivity: Date.now(),
        engagement: 'low',
        purchases: [],
        events: []
      };
      fans.set(id, fan);
      return NextResponse.json({ success: true, fan: { id: fan.id, name: fan.name } });
    }

    if (action === 'segment') {
      const allFans = Array.from(fans.values());
      
      const segments = {
        'VIP': allFans.filter(f => f.lifetimeValue >= 500 && f.engagement === 'high'),
        'At Risk': allFans.filter(f => f.lastActivity < Date.now() - 30 * 86400000 && f.lifetimeValue > 100),
        'Collectors': allFans.filter(f => f.segments.includes('vinyl') || f.segments.includes('collector')),
        'Producers': allFans.filter(f => f.segments.includes('producer')),
        'Casual': allFans.filter(f => f.segments.includes('casual') && f.lifetimeValue < 50),
        'Dormant': allFans.filter(f => f.lastActivity < Date.now() - 60 * 86400000)
      };

      return NextResponse.json({
        success: true,
        segments: Object.fromEntries(
          Object.entries(segments).map(([k, v]) => [k, v.map(f => ({ id: f.id, name: f.name, ltv: f.lifetimeValue }))])
        ),
        total: allFans.length
      });
    }

    if (action === 'predict-churn') {
      const allFans = Array.from(fans.values());
      
      const atRisk = allFans.filter(f => {
        const daysSinceActivity = (Date.now() - f.lastActivity) / 86400000;
        const purchaseFrequency = f.purchases.length / Math.max(1, daysSinceActivity / 30);
        return daysSinceActivity > 21 && purchaseFrequency < 0.5;
      });

      return NextResponse.json({
        success: true,
        atRisk: atRisk.map(f => ({
          id: f.id,
          name: f.name,
          daysInactive: Math.round((Date.now() - f.lastActivity) / 86400000),
          churnProbability: Math.min(95, Math.round(50 + (Date.now() - f.lastActivity) / 8640000))
        }))
      });
    }

    if (action === 'campaign') {
      const { segment, type, message } = data;
      
      // Validate campaign type
      if (type && !VALID_CAMPAIGN_TYPES.includes(type)) {
        return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 });
      }

      // Sanitize message
      const safeMessage = sanitizeString(message, 500);
      
      const targetFans = Array.from(fans.values()).filter(f => {
        if (segment === 'all') return true;
        if (segment === 'VIP') return f.lifetimeValue >= 500;
        if (segment === 'collectors') return f.segments.includes('vinyl') || f.segments.includes('collector');
        if (segment === 'producers') return f.segments.includes('producer');
        return f.segments.includes(segment);
      });

      const campaignId = 'camp_' + Math.random().toString(36).substr(2, 9);
      
      return NextResponse.json({
        success: true,
        campaign: {
          id: campaignId,
          segment,
          type,
          message,
          recipients: targetFans.length,
          estimatedOpenRate: type === 'email' ? 35 : 75,
          estimatedConversion: Math.round(targetFans.length * 0.1),
          sentAt: new Date().toISOString()
        }
      });
    }

    if (action === 'analytics') {
      const allFans = Array.from(fans.values());
      
      const totalLTV = allFans.reduce((sum, f) => sum + f.lifetimeValue, 0);
      const avgLTV = totalLTV / allFans.length;
      
      const sourceBreakdown = allFans.reduce((acc, f) => {
        acc[f.source] = (acc[f.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const engagementBreakdown = allFans.reduce((acc, f) => {
        acc[f.engagement] = (acc[f.engagement] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        analytics: {
          totalFans: allFans.length,
          totalLTV,
          avgLTV: Math.round(avgLTV),
          bySource: sourceBreakdown,
          byEngagement: engagementBreakdown,
          topSpenders: allFans.sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, 5).map(f => ({ name: f.name, ltv: f.lifetimeValue }))
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Groupie Manager error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'groupie-manager',
    name: 'Groupie Manager',
    description: 'Fan segmentation, lifecycle tracking, and automated merch drop campaigns',
    security: {
      inputValidation: true,
      sanitization: true,
      enumValidation: true,
      demoMode: true
    },
    actions: {
      'add-fan': 'Add a new fan to database',
      segment: 'Get fans grouped by segment',
      'predict-churn': 'Identify fans at risk of leaving',
      campaign: 'Create automated campaign',
      analytics: 'Get fan analytics and insights'
    },
    parameters: {
      action: 'required - the action to perform',
      name: 'optional - fan name',
      email: 'optional - fan email',
      telegram: 'optional - Telegram handle',
      segment: 'optional - target segment for campaign',
      type: 'optional - campaign type (email, telegram, discord)'
    },
    segments: ['VIP', 'At Risk', 'Collectors', 'Producers', 'Casual', 'Dormant']
  });
}
