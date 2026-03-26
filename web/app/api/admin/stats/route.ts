import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys';

export const dynamic = 'force-dynamic';

function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return [];
  return adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    // Use ADMIN_EMAILS env var — role field is not exposed in JWT/session
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const BACKEND_API_URL = getBackendApiUrl();
    const INTERNAL_API_KEY = getInternalApiKey();

    const response = await fetch(`${BACKEND_API_URL}/api/openclaw/instances`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      instances: data.instances || [],
      count: data.count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform stats', instances: [], count: 0 },
      { status: 500 }
    );
  }
}
