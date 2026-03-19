"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useBasename, getWalletAddress } from "@/app/hooks/useBasename";

const moreLinks = [
  { href: "/demo",    label: "Demo" },
  { href: "/learn",   label: "Learn" },
  { href: "/news",    label: "News" },
  { href: "/blog",    label: "Blog" },
  { href: "/basefm",  label: "$BASEFM" },
  { href: "/partner", label: "Partner" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Close mobile menu + lock scroll
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

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
          {/* Primary links — always visible */}
          <Link href="/pricing" className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">Pricing</Link>
          <Link href="/why"     className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">Why</Link>
          <Link href="https://raveculture.mintlify.app"    className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">Docs</Link>
          <Link href="/token"   className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">$AGENTBOT</Link>

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors"
              aria-expanded={moreOpen}
              aria-label="Open more menu"
            >
              More
              <svg
                className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {moreOpen && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 z-50">
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Auth */}
          {(!mounted || status === "loading") ? null : session ? (
            <div className="flex items-center gap-4">
              <Link href="/marketplace" className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">
                Marketplace
              </Link>
              <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">
                  Admin
                </Link>
              )}
              <button
                className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors"
                aria-label="Log out"
                onClick={() => signOut()}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded transition-colors">
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
            {/* Primary */}
            <Link href="/pricing"  className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Pricing</Link>
            <Link href="/why"      className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Why</Link>
            <Link href="https://raveculture.mintlify.app"     className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Docs</Link>
            <Link href="/token"    className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>$AGENTBOT</Link>
            <Link href="/marketplace" className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Marketplace</Link>

            {/* More section */}
            <div className="border-t border-gray-800 mt-2 pt-3">
              <p className="text-xs text-gray-600 px-2 pb-1 uppercase tracking-wider">More</p>
              {moreLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-base py-2.5 px-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth */}
            <div className="border-t border-gray-800 mt-2 pt-4 flex flex-col gap-1">
              {!mounted || !session ? (
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
                  <Link href="/login"  className="block text-lg py-3 px-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800" onClick={closeMenu}>Log In</Link>
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
