"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    // Perform sign out on page load
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Signing out...</p>
      </div>
    </main>
  );
}
