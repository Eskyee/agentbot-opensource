'use client';

import Link from 'next/link';

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { href: '/demo', label: 'Demo' },
      { href: '/partner/mimo', label: 'MiMo Partnership' },
      { href: '/agents', label: 'Agents' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/dashboard/invoice', label: 'Invoices' },
      { href: '/dashboard/time', label: 'Time Tracking' },
      { href: '/dashboard/vault', label: 'Vault' },
      { href: '/dashboard/export', label: 'Export' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    heading: 'Builders',
    links: [
      { href: '/documentation', label: 'Docs' },
      { href: '/design-system', label: 'Design System' },
      { href: '/playground/gallery', label: 'Gallery' },
      { href: '/open-learning', label: 'Open Learning' },
      { href: 'https://github.com/Eskyee/agentbot-opensource', label: 'GitHub', external: true },
      {
        href: 'https://deepwiki.com/Eskyee/agentbot-opensource',
        label: 'DeepWiki',
        external: true,
      },
      {
        href: 'https://documenter.getpostman.com/view/53112924/2sBXwsMAeE',
        label: 'API Collection',
        external: true,
      },
      { href: 'https://gitlawb.com/z6MkqDnb', label: 'GitLawb', external: true },
      { href: 'https://openclaw.ai', label: 'OpenClaw', external: true },
    ],
  },
  {
    heading: 'Community',
    links: [
      { href: '/basefm/live', label: 'baseFM Live' },
      { href: '/blog', label: 'Blog' },
      { href: '/news', label: 'News' },
      { href: '/social', label: 'Social' },
      { href: '/token', label: '$AGENTBOT' },
      { href: '/bankr', label: 'Bankr Wallet' },
      { href: '/dashboard/dj-stream', label: 'DJ Dashboard' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/why', label: 'Why Agentbot' },
      { href: '/trust', label: 'Trust & Status' },
      { href: '/showcase', label: 'Showcase' },
      { href: '/use-cases', label: 'Use Cases' },
      { href: '/partner', label: 'Partner' },
      { href: '/advertise', label: 'Advertise' },
      { href: 'https://talent.app/eskyee', label: 'Careers', external: true },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { href: '/json-render-playground', label: 'JSON Render' },
      { href: '/chat-platforms', label: 'Chat Platforms' },
      { href: '/routines', label: 'Routines' },
      { href: '/automations', label: 'Automations' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-black font-mono">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 5-column link grid. The status/version/copyright row now lives in the
            single consolidated StatusBar pinned to the bottom of every page. */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => {
                  const cls = 'text-zinc-500 text-[11px] hover:text-white transition-colors';
                  if ('external' in link && link.external) {
                    return (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cls}
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={link.href}>
                      <Link href={link.href} className={cls}>
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
