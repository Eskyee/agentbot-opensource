"use client";

import { useEffect } from "react";
import { customSignOut } from '@/app/lib/useCustomSession';

export default function LogoutPage() {
  useEffect(() => {
    customSignOut();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white selection:bg-blue-500/30 font-mono">
      <div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm text-zinc-400">Signing out...</p>
      </div>
    </main>
  );
}
