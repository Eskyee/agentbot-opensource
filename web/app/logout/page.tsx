"use client";

import { useEffect } from "react";
import { customSignOut } from '@/app/lib/useCustomSession';

export default function LogoutPage() {
  useEffect(() => {
    customSignOut();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">Signing out...</p>
      </div>
    </main>
  );
}
