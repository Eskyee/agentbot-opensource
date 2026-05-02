'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

const COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { href: '/pricing',      label: 'Pricing' },
      { href: '/demo',         label: 'Demo' },
      { href: '/agents',       label: 'Agents' },
      { href: '/marketplace',  label: 'Marketplace' },
      { href: '/capabilities', label: 'Capabilities' },
      { href: '/use-cases',    label: 'Use Cases' },
      { href: '/partner',      label: 'Partner' },
      { href: '/advertise',    label: 'Advertise' },
    ],
  },
  {
    heading: 'Music',
    links: [
      { href: '/basefm',                label: 'baseFM Live' },
      { href: '/dashboard/mixtape',     label: 'DJ Mix Uploads' },
      { href: '/advertise',             label: 'Advertise on baseFM' },
      { href: '/solana',                label: 'Solana' },
      { href: '/token',                 label: '$AGENTBOT' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { href: '/guide',                                                   label: 'Guide' },
      { href: 'https://github.com/Eskyee/agentbot-opensource',           label: 'GitHub', external: true },
      { href: 'https://gitlawb.com/node/repos/z6MkpUq1/agentbot-opensource', label: 'Gitlawb', external: true },
      { href: 'https://deepwiki.com/Eskyee/agentbot-opensource',         label: 'DeepWiki', external: true },
      { href: 'https://dev.to/agentbot',                                  label: 'Dev.to', external: true },
      { href: 'https://openwebui.com/u/jaieskyravecult115142e2f8',        label: 'Open WebUI', external: true },
    ],
  },
  {
    heading: 'Community',
    links: [
      { href: '/blog',                                               label: 'Blog' },
      { href: '/claim',                                              label: 'Claim Credits' },
      { href: '/buddies',                                            label: 'Buddies' },
      { href: 'https://talent.app/raveculture.base.eth',            label: 'Talent', external: true },
      { href: '/terms',                                              label: 'Terms' },
      { href: '/privacy',                                            label: 'Privacy' },
    ],
  },
]

export default function Footer() {
  const [status, setStatus] = useState<'checking' | 'operational' | 'down'>('checking');
  const [version, setVersion] = useState<string>('v0.0.0');
  const [openClawVersion, setOpenClawVersion] = useState<string>('2026.4.27');

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
    const interval = setInterval(checkStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchVersions() {
      try {
        const [appRes, openClawRes] = await Promise.all([
          fetch('/api/version'),
          fetch('/api/openclaw/version'),
        ])
        if (appRes.ok) {
          const data = await appRes.json()
          if (data.version) setVersion(data.version)
        }
        if (openClawRes.ok) {
          const data = await openClawRes.json()
          if (data.openclawVersion) setOpenClawVersion(data.openclawVersion)
        }
      } catch {}
    }
    fetchVersions()
  }, [])

  return (
    <footer className="w-full border-t border-zinc-900 bg-black font-mono">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* 4-column grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-12">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => {
                  const cls = "text-zinc-600 text-[11px] hover:text-white transition-colors"
                  if ('external' in link && link.external) {
                    return (
                      <li key={link.href}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                          {link.label}
                        </a>
                      </li>
                    )
                  }
                  return (
                    <li key={link.href}>
                      <Link href={link.href} className={cls}>
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-zinc-900 pt-6">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            &copy; 2026 Agentbot &middot; Zero Human Company
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                status === 'operational' ? 'bg-green-500' :
                status === 'down' ? 'bg-orange-500' :
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
              Agentbot {version}
            </span>
            <span className="text-zinc-800 text-[10px]">|</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-700">
              OpenClaw {openClawVersion}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
