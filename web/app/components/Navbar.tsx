"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useBasename, getWalletAddress } from "@/app/hooks/useBasename";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  // isAdmin is set server-side from ADMIN_EMAILS env var via JWT callback
  const isAdmin = session?.user?.isAdmin === true;
  const walletAddress = getWalletAddress(session?.user?.email);
  const { basename } = useBasename(walletAddress);
  // Display name: Basename > truncated address > name > email username
  const displayName = basename
    ?? (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : null)
    ?? session?.user?.name
    ?? session?.user?.email?.split('@')[0]
    ?? null;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="w-full flex items-center justify-between px-4 py-3 fixed top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-lg font-medium text-white flex items-center gap-2 rounded"
            onClick={closeMenu}
          >
            <span className="text-2xl" role="img" aria-label="Lobster">🦞</span>
            <span className="hidden sm:inline">Agentbot</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-gray-400 hover:text-white rounded transition-colors">Pricing</Link>
          <Link href="/demo" className="text-sm text-gray-400 hover:text-white rounded transition-colors">Demo</Link>
          <Link href="/why" className="text-sm text-gray-400 hover:text-white rounded transition-colors">Why</Link>
          <Link href="/learn" className="text-sm text-gray-400 hover:text-white rounded transition-colors">Learn</Link>
          <Link href="/news" className="text-sm text-gray-400 hover:text-white rounded transition-colors">News</Link>
          <Link href="/blog" className="text-sm text-gray-400 hover:text-white rounded transition-colors">Blog</Link>
          <Link href="/docs" className="text-sm text-gray-400 hover:text-white rounded transition-colors">Docs</Link>
          <Link href="/basefm" className="text-sm text-gray-400 hover:text-white rounded transition-colors">$BASEFM</Link>
          <Link href="/token" className="text-sm text-gray-400 hover:text-white rounded transition-colors">$AGENTBOT</Link>
          <Link href="/partner" className="text-sm text-gray-400 hover:text-white rounded transition-colors">Partner</Link>

          {status === "loading" ? null : session ? (
            <div className="flex items-center gap-4">
              <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white rounded transition-colors">
                Marketplace
              </Link>
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white rounded transition-colors">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-gray-400 hover:text-white rounded transition-colors">
                  Admin
                </Link>
              )}
              <button
                className="text-sm text-gray-400 hover:text-white rounded transition-colors"
                onClick={() => signOut()}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white rounded transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="text-sm bg-white text-black px-3 py-1.5 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded touch-manipulation"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu — rendered OUTSIDE <nav> to avoid backdrop-filter compositing layer
          that breaks touch events on iOS Safari */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 bg-black z-[60] overflow-y-auto"
          style={{ top: 57 }}
        >
          <div className="flex flex-col p-4 gap-1">
            <Link href="/pricing" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Pricing</Link>
            <Link href="/why" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Why</Link>
            <Link href="/learn" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Learn</Link>
            <Link href="/news" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>News</Link>
            <Link href="/blog" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Blog</Link>
            <Link href="/docs" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Docs</Link>
            <Link href="/marketplace" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Marketplace</Link>
            <Link href="/token" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>$AGENTBOT</Link>

            <div className="border-t border-gray-800 mt-2 pt-4 flex flex-col gap-1">
              {session ? (
                <>
                  {displayName && (
                    <div className="text-sm text-gray-500 px-2 pb-2">{displayName}</div>
                  )}
                  <Link href="/dashboard" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Dashboard</Link>
                  {isAdmin && (
                    <Link href="/admin" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Admin</Link>
                  )}
                  <button
                    onClick={() => { closeMenu(); signOut(); }}
                    className="text-left text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800 w-full"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Log In</Link>
                  <Link href="/signup" className="block text-lg py-3 px-2 text-white font-medium rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
