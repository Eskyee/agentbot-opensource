'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [version, setVersion] = useState('');
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/openclaw-version')
      .then(res => res.json())
      .then(data => setVersion(data.openclawVersion))
      .catch(() => setVersion(''));

    fetch('/api/health')
      .then(res => {
        setIsHealthy(res.ok);
      })
      .catch(() => setIsHealthy(false));
  }, []);

  return (
    <footer className="w-full border-t border-gray-800 py-8 mt-auto bg-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link>
            <Link href="/partner" className="text-gray-400 hover:text-white transition-colors">Partner</Link>
            <Link href="/token" className="text-gray-400 hover:text-white transition-colors">$AGENTBOT</Link>
            <Link href="/basefm" className="text-gray-400 hover:text-white transition-colors">$BASEFM</Link>
            <a href="https://stackoverflow.com/users/13100302/agentbot-openclaw" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Stack Overflow</a>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>© 2026 Agentbot</span>
            <span>·</span>
            <span>Zero Human Company</span>
            {version && <><span>·</span><span>OpenClaw v{version}</span></>}
          </div>
        </div>
      </div>
    </footer>
  );
}
