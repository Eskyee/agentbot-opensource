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
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors underline">Pricing</Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors underline">Docs</Link>
            <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors underline">Marketplace</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors underline">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors underline">Privacy</Link>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isHealthy === null ? 'bg-gray-500' : isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isHealthy === null ? 'Checking...' : isHealthy ? 'Operational' : 'Offline'}</span>
            </div>
            <span>•</span>
            <span>© 2026 Agentbot baseFM RaveCulture</span>
            {version && <><span>•</span><span>v{version}</span></>}
          </div>
        </div>
      </div>
    </footer>
  );
}
