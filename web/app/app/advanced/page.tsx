'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * /app/advanced — Gateway to the existing Advanced experience.
 *
 * Per Rule 4 (Route safety rule): this must always provide access
 * to the current app experience. It is NOT a stripped-down version.
 *
 * This page sets the user's mode to 'advanced' and redirects to
 * the current dashboard. If the redirect fails, the page shows
 * direct links to all advanced sections.
 */
export default function AdvancedPage() {
  const router = useRouter();

  useEffect(() => {
    // Set user mode to advanced
    fetch('/api/operator/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'advanced' }),
    }).catch(() => {
      // Silent fail — the redirect still works
    });

    // Redirect to the current advanced dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="text-4xl">◈</div>
        <h1 className="text-2xl font-bold">Switching to Advanced Mode</h1>
        <p className="text-zinc-400">
          Redirecting to the full dashboard with all runtime controls, skills, workflows, and
          configuration options.
        </p>
        <div className="text-sm text-zinc-500">
          If you&apos;re not redirected,{' '}
          <Link href="/dashboard" className="text-white hover:underline">
            click here
          </Link>
        </div>

        {/* Fallback: direct links to all advanced sections */}
        <div className="mt-8 pt-8 border-t border-zinc-900">
          <h2 className="text-xs uppercase tracking-widest text-zinc-600 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link
              href="/dashboard"
              className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/skills"
              className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
            >
              Skills
            </Link>
            <Link
              href="/dashboard/workflows"
              className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
            >
              Workflows
            </Link>
            <Link
              href="/dashboard/wallet"
              className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
            >
              Wallet
            </Link>
            <Link
              href="/dashboard/channels"
              className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
            >
              Channels
            </Link>
            <Link
              href="/settings"
              className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
