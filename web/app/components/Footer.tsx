'use client';

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 py-8 mt-auto bg-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/why" className="text-gray-400 hover:text-white transition-colors">Why</Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
            <Link href="https://raveculture.mintlify.app" className="text-gray-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link>
            <Link href="/partner" className="text-gray-400 hover:text-white transition-colors">Partner</Link>
            <Link href="/token" className="text-gray-400 hover:text-white transition-colors">$AGENTBOT</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>© 2026 Agentbot</span>
            <span>·</span>
            <span>Zero Human Company</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
