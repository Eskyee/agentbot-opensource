import { createHmac } from 'node:crypto';

// Shared client for the agentbot-backend API. Requests are authenticated with
// signed user-context headers: x-user-id/email/role, plus an HMAC-SHA256
// signature over `METHOD:path:userId:email:role:timestamp` when HMAC_SECRET is set.
//
// Per-user scoping: when ctx is passed, the user identity comes from the Eve
// session (ctx.session.auth), ensuring each user only accesses their own data.
//
// Required env:
//   BACKEND_API_URL              base URL (defaults to the Railway production host)
//   HMAC_SECRET                  shared signing secret (must match the backend)

const BASE_URL =
  process.env.BACKEND_API_URL || 'https://YOUR_SERVICE_URL';

interface UserContext {
  userId: string;
  email: string;
  role?: string;
}

function signedHeaders(method: string, path: string, user?: UserContext): Record<string, string> {
  const userId = user?.userId || process.env.AGENTBOT_SERVICE_USER_ID || '';
  const userEmail = user?.email || process.env.AGENTBOT_SERVICE_USER_EMAIL || '';
  const userRole = user?.role || process.env.AGENTBOT_SERVICE_USER_ROLE || 'user';
  const secret = process.env.HMAC_SECRET || '';

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-user-id': userId,
    'x-user-email': userEmail,
    'x-user-role': userRole,
  };

  if (secret) {
    const timestamp = Date.now().toString();
    const payload = `${method.toUpperCase()}:${path}:${userId}:${userEmail}:${userRole}:${timestamp}`;
    headers['x-user-signature'] = createHmac('sha256', secret).update(payload).digest('hex');
    headers['x-user-signature-timestamp'] = timestamp;
  }

  return headers;
}

export type { UserContext };

export async function backendGet<T = unknown>(
  path: string,
  query?: Record<string, string | undefined>,
  user?: UserContext
): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: signedHeaders('GET', path, user),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`agentbot-backend GET ${path} failed: ${res.status} ${detail}`.trim());
  }
  return res.json() as Promise<T>;
}

export async function backendPost<T = unknown>(
  path: string,
  body: unknown,
  user?: UserContext
): Promise<T> {
  const res = await fetch(new URL(path, BASE_URL).toString(), {
    method: 'POST',
    headers: signedHeaders('POST', path, user),
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`agentbot-backend POST ${path} failed: ${res.status} ${detail}`.trim());
  }
  return res.json() as Promise<T>;
}

export async function backendDelete<T = unknown>(path: string, user?: UserContext): Promise<T> {
  const res = await fetch(new URL(path, BASE_URL).toString(), {
    method: 'DELETE',
    headers: signedHeaders('DELETE', path, user),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`agentbot-backend DELETE ${path} failed: ${res.status} ${detail}`.trim());
  }
  return res.json() as Promise<T>;
}
