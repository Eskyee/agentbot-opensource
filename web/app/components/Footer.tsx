'use client';

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-black font-mono">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            &copy; 2026 Agentbot &middot; Zero Human Company
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              { href: '/why', label: 'Why' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/blog', label: 'Blog' },
              { href: 'https://raveculture.mintlify.app', label: 'Docs' },
              { href: '/marketplace', label: 'Marketplace' },
              { href: '/partner', label: 'Partner' },
              { href: '/token', label: '$AGENTBOT' },
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
