'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface StatusData {
  users: number | null;
  online: boolean;
}

const RELEASES_URL = 'https://github.com/Eskyee/agentbot-opensource/releases';

export function StatusBar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusData>({ users: null, online: true });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [version, setVersion] = useState('v1.2.0');
  const [openClawVersion, setOpenClawVersion] = useState('2026.6.6');

  const hidden = pathname.startsWith('/playground');

  // Live system status + user count (polls /api/health).
  useEffect(() => {
    if (hidden) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data = await res.json();
        setStatus({
          users: typeof data.totalUsers === 'number' ? data.totalUsers : null,
          online: data.status === 'healthy' || data.status === 'ok',
        });
        setLastUpdate(new Date());
      } catch {
        setStatus((prev) => ({ ...prev, online: false }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [hidden]);

  // App + OpenClaw versions. Falls back to the last known stable so the bar
  // never shows "v0.0.0" when the version endpoint reports zeros.
  useEffect(() => {
    if (hidden) return;

    async function fetchVersions() {
      try {
        const [appRes, openClawRes] = await Promise.all([
          fetch('/api/version'),
          fetch('/api/openclaw/version'),
        ]);
        if (appRes.ok) {
          const data = await appRes.json();
          const v: string | undefined = data.version;
          if (v && v !== '0.0.0' && v !== 'v0.0.0') {
            setVersion(v.startsWith('v') ? v : `v${v}`);
          }
        }
        if (openClawRes.ok) {
          const data = await openClawRes.json();
          if (data.openclawVersion) setOpenClawVersion(data.openclawVersion);
        }
      } catch {}
    }

    fetchVersions();
  }, [hidden]);

  if (hidden) return null;

  // Always-correct date so the "today" badge is never stale.
  const today = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-900/50 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 text-[10px] gap-4">
          {/* Live status — left */}
          <div className="flex items-center gap-3 text-zinc-500 overflow-x-auto whitespace-nowrap">
            <span className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.online ? 'bg-green-500' : 'bg-orange-500'
                }`}
              />
              <span
                className={`font-bold uppercase tracking-wider ${
                  status.online ? 'text-green-500' : 'text-orange-500'
                }`}
              >
                {status.online ? 'Systems Operational' : 'Systems Degraded'}
              </span>
            </span>
            {status.users !== null && (
              <>
                <span className="hidden sm:inline text-zinc-800">·</span>
                <span className="hidden sm:inline">{status.users} users</span>
              </>
            )}
            <span className="hidden md:inline text-zinc-800">·</span>
            <span className="hidden md:inline text-zinc-500">
              {lastUpdate
                ? `updated ${lastUpdate.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ''}
            </span>
          </div>

          {/* Meta — right: date · version · openclaw · releases · feedback · copyright */}
          <div className="flex items-center gap-3 text-zinc-500 overflow-x-auto whitespace-nowrap uppercase tracking-wider">
            <span className="hidden lg:inline">{today} · Today</span>
            <span className="hidden lg:inline text-zinc-800">·</span>
            <span className="hidden sm:inline">Stable {version}</span>
            <span className="hidden md:inline text-zinc-800">·</span>
            <span className="hidden md:inline">OpenClaw {openClawVersion}</span>
            <span className="hidden md:inline text-zinc-800">·</span>
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline hover:text-white transition-colors"
            >
              Releases
            </a>
            <span className="hidden sm:inline text-zinc-800">·</span>
            <a
              href="mailto:hello@agentbot.sh?subject=Feedback"
              className="hidden sm:inline text-orange-500 hover:text-orange-400 transition-colors"
            >
              Have Feedback?
            </a>
            <span className="hidden sm:inline text-zinc-800">·</span>
            <span className="text-zinc-500 normal-case">© 2026 Agentbot · Zero Human Company</span>
          </div>
        </div>
      </div>
    </div>
  );
}
