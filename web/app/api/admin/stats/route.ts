import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys';

const BACKEND_API_URL = getBackendApiUrl();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const INTERNAL_API_KEY = getInternalApiKey();
    
    // Safety: Only admins can access stats
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Proxy request to the backend for actual instance stats
    const response = await fetch(`${BACKEND_API_URL}/api/openclaw/instances`, {
      headers: {
        'Authorization': `Bearer ${INTERNAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    
    // Return sanitized instance list for the admin UI
    return NextResponse.json({
      instances: data.instances || [],
      count: data.count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch platform stats',
      instances: [],
      count: 0
    }, { status: 500 });
  }
}
