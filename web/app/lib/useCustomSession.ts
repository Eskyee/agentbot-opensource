import { useState, useEffect } from 'react';

interface CustomSession {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    isAdmin?: boolean;
  };
}

export function useCustomSession() {
  const [session, setSession] = useState<CustomSession | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            if (data.user) {
              setSession(data);
              setStatus('authenticated');
            } else {
              setStatus('unauthenticated');
            }
          }
        } else if (!cancelled) {
          setStatus('unauthenticated');
        }
      } catch {
        if (!cancelled) {
          setStatus('unauthenticated');
        }
      }
    }
    fetchSession();
    return () => { cancelled = true; };
  }, []);

  return { data: session, status };
}

export async function customSignOut() {
  await fetch('/api/auth/signout', { method: 'POST' });
  window.location.href = '/';
}
