/**
 * POST /api/security/scan — Run a security scan on the codebase.
 *
 * Uses deepsec-style pattern matching to find vulnerabilities.
 * Returns findings with severity ratings.
 */

import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { runSecurityScan } from '@/app/lib/security-scanner';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can run security scans
  if (!(session.user as any).isAdmin) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const report = await runSecurityScan(session.user.id);

    return Response.json({
      ok: true,
      report: {
        scanId: report.scanId,
        filesScanned: report.filesScanned,
        findings: report.findings,
        summary: report.summary,
        duration: report.completedAt.getTime() - report.startedAt.getTime(),
      },
    });
  } catch (error) {
    console.error('[security/scan] Failed:', error);
    return Response.json({ error: 'Scan failed' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(session.user as any).isAdmin) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  return Response.json({
    message: 'Security scan endpoint',
    usage: 'POST /api/security/scan to run a scan',
  });
}
