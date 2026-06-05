"use client";
import Link from "next/link";
import Image from "next/image";
import { useCustomSession, customSignOut } from "@/app/lib/useCustomSession";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import { usePathname } from "next/navigation";
import { useBasename, getWalletAddress } from "@/app/hooks/useBasename";
import { NotificationBell } from "@/app/social/_components/NotificationBell";
import { CreditBadge } from "@/app/components/CreditBadge";

// ─── Simplified nav: product-focused ─────────────────────────────────────────
// LOGGED-OUT: Demo | Docs | Pricing → Sign in | Get Started
// LOGGED-IN:  Dashboard | Chat | baseFM → user menu
// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { data: session, status } = useCustomSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isAdmin = session?.user?.isAdmin === true;
  const walletAddress = getWalletAddress(session?.user?.email);
  const { basename } = useBasename(walletAddress);
  const displayName = basename
    ?? (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : null)
    ?? session?.user?.name
    ?? session?.user?.email?.split('@')[0]
    ?? null;

  const closeMenu = () => setMenuOpen(false);
  const isLoggedIn = mounted && session;

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 h-14 fixed top-0 z-50 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.94))] border-b border-zinc-800/50 font-mono backdrop-blur-sm">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={closeMenu}>
          <Image src="/icons/icon-192x192.png" alt="Agentbot" width={22} height={22} priority className="rounded" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Agentbot</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-7">
          {!mounted || status === "loading" ? (
            <div className="flex gap-6">
              {[1,2,3].map(i => <div key={i} className="w-14 h-3 bg-zinc-900 animate-pulse rounded" />)}
            </div>
          ) : isLoggedIn ? (
            <>
              <NavLink href="/dashboard" current={pathname}>Dashboard</NavLink>
              <NavLink href="/chat" current={pathname}>Chat</NavLink>
              <NavLink href="/credits" current={pathname}>Credits</NavLink>
              <NavLink href="/playground" current={pathname}>Playground</NavLink>
              <NavLink href="/dashboard/dj-stream" current={pathname}>baseFM</NavLink>
              <NavLink href="/wristband" current={pathname}>Wristband</NavLink>
              <NavLink href="/dashboard/swap" current={pathname}>Swap</NavLink>
              <NavLink href="/vercel-gateway" current={pathname}>Gateway</NavLink>

              <CreditBadge />
              <NotificationBell />
            </>
          ) : (
            <>
              <NavLink href="/demo" current={pathname}>Demo</NavLink>
              <NavLink href="/partner/mimo" current={pathname}>MiMo</NavLink>
              <NavLink href="/documentation" current={pathname}>Docs</NavLink>
              <NavLink href="/pricing" current={pathname}>Pricing</NavLink>
              <NavLink href="/vercel-gateway" current={pathname}>Gateway</NavLink>
              <NavLink href="/voice" current={pathname}>Voice</NavLink>
              <NavLink href="/credits" current={pathname}>Credits</NavLink>
              <NavLink href="/usage/global" current={pathname}>Usage</NavLink>
            </>
          )}
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {!mounted || status === "loading" ? (
            <div className="w-24 h-8" />
          ) : isLoggedIn ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-[11px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                <span className="truncate max-w-[100px]">{displayName}</span>
                <svg className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-48 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl z-50 overflow-hidden">
                  <div className="py-2">
                    <div className="px-4 py-2.5 border-b border-zinc-800/50">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{displayName}</span>
                    </div>
                    <UserMenuLink href="/dashboard" onClick={() => setUserMenuOpen(false)}>Dashboard</UserMenuLink>
                    <UserMenuLink href="/chat" onClick={() => setUserMenuOpen(false)}>Chat</UserMenuLink>
                    <UserMenuLink href="/agents" onClick={() => setUserMenuOpen(false)}>Agents</UserMenuLink>
                    <UserMenuLink href="/billing" onClick={() => setUserMenuOpen(false)}>Billing</UserMenuLink>
                    <UserMenuLink href="/settings" onClick={() => setUserMenuOpen(false)}>Settings</UserMenuLink>
                    {isAdmin && (
                      <UserMenuLink href="/dashboard/admin" onClick={() => setUserMenuOpen(false)}>
                        <span className="text-orange-500">Admin</span>
                      </UserMenuLink>
                    )}
                    <div className="border-t border-zinc-800/50 mt-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); customSignOut(); }}
                        className="block w-full text-left px-4 py-2.5 text-[11px] text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-[11px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
                Sign in
              </Link>
              <Link href="/signup" className="text-[11px] bg-white text-black px-4 py-1.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 -mr-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(12,10,9,1))] z-[60] overflow-y-auto font-mono" style={{ top: 56 }}>
          <div className="flex flex-col p-6 gap-1 pb-12">
            {isLoggedIn ? (
              <>
                <MobileLink href="/dashboard" onClick={closeMenu}>Dashboard</MobileLink>
                <MobileLink href="/chat" onClick={closeMenu}>Chat</MobileLink>
                <MobileLink href="/credits" onClick={closeMenu}>Credits</MobileLink>
                <MobileLink href="/playground" onClick={closeMenu}>Playground</MobileLink>
                <MobileLink href="/dashboard/dj-stream" onClick={closeMenu}>baseFM</MobileLink>
                <MobileLink href="/wristband" onClick={closeMenu}>Wristband</MobileLink>
                <MobileLink href="/dashboard/swap" onClick={closeMenu}>Swap</MobileLink>
                <MobileLink href="/vercel-gateway" onClick={closeMenu}>Gateway</MobileLink>
                <MobileLink href="/agents" onClick={closeMenu}>Agents</MobileLink>
                <div className="border-t border-zinc-900 mt-4 pt-4">
                  {displayName && <div className="text-[10px] text-zinc-600 px-3 pb-2 uppercase tracking-widest">{displayName}</div>}
                  <MobileLink href="/billing" onClick={closeMenu}>Billing</MobileLink>
                  <MobileLink href="/settings" onClick={closeMenu}>Settings</MobileLink>
                  {isAdmin && <MobileLink href="/dashboard/admin" onClick={closeMenu}>Admin</MobileLink>}
                  <button
                    onClick={() => { closeMenu(); customSignOut(); }}
                    className="text-left text-xs py-2.5 px-3 text-zinc-500 hover:text-white w-full uppercase tracking-wider"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <MobileLink href="/demo" onClick={closeMenu}>Demo</MobileLink>
                <MobileLink href="/playground" onClick={closeMenu}>Playground</MobileLink>
                <MobileLink href="/documentation" onClick={closeMenu}>Docs</MobileLink>
                <MobileLink href="/pricing" onClick={closeMenu}>Pricing</MobileLink>
                <MobileLink href="/vercel-gateway" onClick={closeMenu}>Gateway</MobileLink>
                <MobileLink href="/credits" onClick={closeMenu}>Credits</MobileLink>
                <MobileLink href="/usage/global" onClick={closeMenu}>Usage</MobileLink>
                <div className="border-t border-zinc-900 mt-4 pt-6 flex flex-col gap-3">
                  <Link href="/login" onClick={closeMenu} className="block text-center py-3 text-zinc-400 border border-zinc-800 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors">
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={closeMenu} className="block text-center py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const isActive = current === href || current.startsWith(href + '/');
  const isExternal = href.startsWith('http');
  return (
    <Link
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`text-[11px] uppercase tracking-widest transition-colors ${
        isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

function UserMenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2.5 text-[11px] text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children, external }: { href: string; onClick: () => void; children: React.ReactNode; external?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="block text-xs py-2.5 px-3 text-zinc-400 hover:text-white uppercase tracking-wider transition-colors"
    >
      {children}
    </Link>
  );
}
