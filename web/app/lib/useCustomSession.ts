import { useState, useEffect, useRef } from 'react';

interface CustomSession {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    isAdmin?: boolean;
  };
}

// Module-level cache — session is fetched once, shared across all components
let cachedSession: CustomSession | null = null;
let cachedStatus: 'loading' | 'authenticated' | 'unauthenticated' = 'loading';
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<(session: CustomSession | null, status: typeof cachedStatus) => void>();

async function fetchSessionOnce() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          cachedSession = data;
          cachedStatus = 'authenticated';
        } else {
          cachedStatus = 'unauthenticated';
        }
      } else {
        cachedStatus = 'unauthenticated';
      }
    } catch {
      cachedStatus = 'unauthenticated';
    }
    // Notify all subscribers
    listeners.forEach(fn => fn(cachedSession, cachedStatus));
  })();
  return fetchPromise;
}

export function useCustomSession() {
  const [session, setSession] = useState<CustomSession | null>(cachedSession);
  const [status, setStatus] = useState<typeof cachedStatus>(cachedStatus);

  useEffect(() => {
    const listener = (s: CustomSession | null, st: typeof cachedStatus) => {
      setSession(prev => prev === s ? prev : s);
      setStatus(prev => prev === st ? prev : st);
    };
    listeners.add(listener);

    // Only fetch if not already resolved
    if (cachedStatus === 'loading') {
      fetchSessionOnce();
    }

    return () => { listeners.delete(listener); };
  }, []);

  return { data: session, status };
}

export async function customSignOut() {
  await fetch('/api/auth/signout', { method: 'POST' });
  window.location.href = '/';
}
