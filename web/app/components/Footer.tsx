'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [status, setStatus] = useState<'checking' | 'operational' | 'down'>('checking');

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/health');
        setStatus(res.ok ? 'operational' : 'down');
      } catch {
        setStatus('down');
      }
    }
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-zinc-900 bg-black font-mono">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex flex-col gap-3">
            <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
              &copy; 2026 Agentbot &middot; Zero Human Company
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'operational' ? 'bg-green-500' :
                  status === 'down' ? 'bg-red-500' :
                  'bg-yellow-500 animate-pulse'
                }`} />
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                  {status === 'operational' ? 'Systems Operational' :
                   status === 'down' ? 'Systems Degraded' :
                   'Checking Status'}
                </span>
              </div>
              <span className="text-zinc-800 text-[10px]">|</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-700">
                OpenClaw v2026.3.23
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              { href: '/why', label: 'Why' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/blog', label: 'Blog' },
              { href: 'https://docs.agentbot.raveculture.xyz', label: 'Docs' },
              { href: '/marketplace', label: 'Marketplace' },
              { href: '/partner', label: 'Partner' },
              { href: '/token', label: '$AGENTBOT' },
              { href: 'https://github.com/Eskyee/agentbot-opensource', label: 'GitHub' },
              { href: 'https://talent.app/raveculture.base.eth', label: 'Talent' },
              { href: 'https://openwebui.com/u/jaieskyravecult115142e2f8', label: 'Open WebUI' },
              { href: '/terms', label: 'Terms' },
              { href: '/privacy', label: 'Privacy' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-600 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
