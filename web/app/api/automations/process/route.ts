import { NextRequest } from 'next/server';
import { processPendingRuns } from '@/app/lib/automation-engine';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Verify this is an internal call (cron or queue)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processPendingRuns();
    return Response.json({ ok: true, message: 'Pending runs processed' });
  } catch (error) {
    console.error('[automations/process] Error:', error);
    return Response.json({ error: 'Failed to process runs' }, { status: 500 });
  }
}
