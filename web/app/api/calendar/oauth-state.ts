import crypto from 'crypto';

const OAUTH_STATE_SECRET =
  process.env.CALENDAR_OAUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'calendar-state-fallback';

export function signOAuthState(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', OAUTH_STATE_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyOAuthState(state: string): { userId: string; ts: number } | null {
  try {
    const [payload, sig] = state.split('.');
    const expected = crypto.createHmac('sha256', OAUTH_STATE_SECRET).update(payload).digest('base64url');
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (Date.now() - data.ts > 10 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}
