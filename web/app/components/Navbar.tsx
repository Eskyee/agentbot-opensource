"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-black border-b border-gray-900">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-white">Agentbot</Link>
        <Link href="/docs" className="text-gray-300 hover:text-white">Docs</Link>
        <Link href="/marketplace" className="text-gray-300 hover:text-white">Marketplace</Link>
      </div>
      <div className="flex items-center gap-4">
        {status === "loading" ? null : session ? (
          <>
            <span className="text-gray-300">{session.user?.email || session.user?.name}</span>
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 transition-colors" onClick={() => signOut()}>Log out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="rounded-lg bg-gray-900 px-4 py-2 text-white font-semibold hover:bg-gray-700 transition-colors">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 transition-colors">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
