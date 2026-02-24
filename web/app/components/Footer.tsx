import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 py-8 mt-auto bg-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors underline">Pricing</Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors underline">Docs</Link>
            <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors underline">Marketplace</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors underline">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors underline">Privacy</Link>
          </div>
          
          <div className="text-sm text-gray-500">
            © 2026 Agentbot baseFM RaveCulture
          </div>
        </div>
      </div>
    </footer>
  );
}
