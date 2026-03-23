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
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setSession(data);
            setStatus('authenticated');
          } else {
            setStatus('unauthenticated');
          }
        } else {
          setStatus('unauthenticated');
        }
      } catch {
        setStatus('unauthenticated');
      }
    }
    fetchSession();
  }, []);

  return { data: session, status };
}

export async function customSignOut() {
  await fetch('/api/auth/signout', { method: 'POST' });
  window.location.href = '/';
}
