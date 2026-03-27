import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Google RISC (Risk Incident Sharing and Collaboration) webhook
// Receives security events from Google about compromised accounts
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Parse the JWT from the request body
    // Google sends SECEVENT (Security Events) JWTs
    const jwt = body;
    
    // Decode the JWT (in production, verify signature with Google's public keys)
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid JWT' }, { status: 400 });
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const eventType = payload?.events?.[Object.keys(payload.events || {})[0]];
    
    console.log('[RISC] Security event received:', {
      iss: payload.iss,
      sub: payload.sub,
      eventType: Object.keys(payload.events || {})[0],
      timestamp: new Date().toISOString(),
    });
    
    // Handle different event types
    const events = payload.events || {};
    
    for (const [eventUri, eventData] of Object.entries(events)) {
      switch (eventUri) {
        case 'https://schemas.openid.net/secevent/risc/event-type/account-compromised':
          // Revoke all sessions for this user
          await handleAccountCompromised(payload.sub, eventData);
          break;
          
        case 'https://schemas.openid.net/secevent/risc/event-type/account-disabled':
          await handleAccountDisabled(payload.sub);
          break;
          
        case 'https://schemas.openid.net/secevent/risc/event-type/account-enabled':
          await handleAccountEnabled(payload.sub);
          break;
          
        case 'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked':
          await handleSessionsRevoked(payload.sub);
          break;
          
        case 'https://schemas.openid.net/secevent/risc/event-type/identifier-changed':
          await handleIdentifierChanged(payload.sub, eventData);
          break;
          
        default:
          console.log('[RISC] Unknown event type:', eventUri);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[RISC] Error processing security event:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleAccountCompromised(sub: string, eventData: any) {
  console.log('[RISC] Account compromised:', sub);
  
  // Find user by email (sub is usually the email for Google RISC events)
  const user = await prisma.user.findFirst({
    where: { email: sub },
  });
  
  if (user) {
    // Revoke all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
    
    console.log('[RISC] All sessions revoked for user:', user.id);
  }
}

async function handleAccountDisabled(sub: string) {
  console.log('[RISC] Account disabled:', sub);
  
  const user = await prisma.user.findFirst({
    where: { email: sub },
  });
  
  if (user) {
    // Revoke all sessions (can't disable user without status field)
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
    console.log('[RISC] Sessions revoked for disabled account:', user.id);
  }
}

async function handleAccountEnabled(sub: string) {
  console.log('[RISC] Account enabled:', sub);
  // No action needed — sessions will be recreated on next login
}

async function handleSessionsRevoked(sub: string) {
  console.log('[RISC] Sessions revoked:', sub);
  
  const user = await prisma.user.findFirst({
    where: { email: sub },
  });
  
  if (user) {
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
  }
}

async function handleIdentifierChanged(sub: string, eventData: any) {
  console.log('[RISC] Identifier changed:', sub, eventData);
  
  // Invalidate old sessions when email changes
  const user = await prisma.user.findFirst({
    where: { email: sub },
  });
  
  if (user) {
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
  }
}
