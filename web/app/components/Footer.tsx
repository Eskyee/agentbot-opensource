import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 bg-black/50 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
          
          <div className="text-sm text-gray-500">
            <Link href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Deploy OpenClaw
            </Link> •{' '}
            <Link href="https://moltx.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Moltx
            </Link> •{' '}
            <Link href="https://www.moltbook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Moltbook
            </Link>{' '}
            <Link href="https://uk.linkedin.com/in/steipete" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              steipete
            </Link> •{' '}
            <Link href="https://x.com/Esky33junglist" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              @Esky33junglist
            </Link> •{' '}
            <Link href="https://raveculture.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              raveculture.xyz
            </Link> © 2026 Agentbot • Built with ❤️ in London by raveculture
          </div>
        </div>
      </div>
    </footer>
  );
}
