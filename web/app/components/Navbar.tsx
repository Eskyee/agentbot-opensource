"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useBasename, getWalletAddress } from "@/app/hooks/useBasename";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isAdmin = session?.user?.isAdmin === true;
  const walletAddress = getWalletAddress(session?.user?.email);
  const { basename } = useBasename(walletAddress);
  const displayName = basename
    ?? (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null)
    ?? session?.user?.name
    ?? session?.user?.email?.split('@')[0]
    ?? null;

  const closeMenu = () => setMenuOpen(false);
  const isLoggedIn = mounted && session;
  const isDashboard = pathname.startsWith('/dashboard');

  // Hide top nav completely on dashboard -- sidebar handles navigation
  if (isDashboard && isLoggedIn) return null;

  return (
    <>
      <nav className="w-full flex items-center justify-between px-4 lg:px-6 h-14 fixed top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/[0.06]">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5" onClick={closeMenu}>
          <span className="text-xl">🦞</span>
          <span className="font-bold tracking-tight text-[15px]">Agentbot</span>
        </Link>

        {/* Center: Primary nav (desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {isLoggedIn ? (
            <>
              <NavLink href="/dashboard" current={pathname}>Dashboard</NavLink>
              <NavLink href="/agents" current={pathname}>Agents</NavLink>
              <NavLink href="/marketplace" current={pathname}>Marketplace</NavLink>
              <NavLink href="https://raveculture.mintlify.app" current={pathname}>Docs</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/pricing" current={pathname}>Pricing</NavLink>
              <NavLink href="/why" current={pathname}>Why</NavLink>
              <NavLink href="/agents" current={pathname}>Agents</NavLink>
              <NavLink href="/marketplace" current={pathname}>Marketplace</NavLink>
              <NavLink href="/demo" current={pathname}>Demo</NavLink>
              <NavLink href="https://raveculture.mintlify.app" current={pathname}>Docs</NavLink>
            </>
          )}
        </div>

        {/* Right: Auth actions (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {!mounted || status === "loading" ? (
            <div className="w-16 h-8" />
          ) : isLoggedIn ? (
            <>
              {isAdmin && <NavLink href="/admin" current={pathname}>Admin</NavLink>}
              <span className="text-sm text-gray-400 truncate max-w-[120px]">{displayName}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
                Log in
              </Link>
              <Link href="/signup" className="text-sm bg-white text-black px-4 py-1.5 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 -mr-2 rounded-lg touch-manipulation"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 bg-black z-[60] overflow-y-auto" style={{ top: 56 }}>
          <div className="flex flex-col p-4 gap-0.5">
            {isLoggedIn ? (
              <>
                <MobileSection label="Navigate">
                  <MobileLink href="/dashboard" onClick={closeMenu}>Dashboard</MobileLink>
                  <MobileLink href="/agents" onClick={closeMenu}>Agents</MobileLink>
                  <MobileLink href="/marketplace" onClick={closeMenu}>Marketplace</MobileLink>
                  <MobileLink href="https://raveculture.mintlify.app" onClick={closeMenu}>Docs</MobileLink>
                </MobileSection>
                <MobileSection label="Account">
                  {displayName && <div className="text-sm text-gray-500 px-3 py-2">{displayName}</div>}
                  <MobileLink href="/billing" onClick={closeMenu}>Billing</MobileLink>
                  <MobileLink href="/settings" onClick={closeMenu}>Settings</MobileLink>
                  {isAdmin && <MobileLink href="/admin" onClick={closeMenu}>Admin</MobileLink>}
                  <button
                    onClick={() => { closeMenu(); signOut(); }}
                    className="text-left text-base py-2.5 px-3 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 w-full"
                  >
                    Log out
                  </button>
                </MobileSection>
              </>
            ) : (
              <>
                <MobileSection label="Explore">
                  <MobileLink href="/pricing" onClick={closeMenu}>Pricing</MobileLink>
                  <MobileLink href="/why" onClick={closeMenu}>Why Agentbot</MobileLink>
                  <MobileLink href="/agents" onClick={closeMenu}>Agent Templates</MobileLink>
                  <MobileLink href="/marketplace" onClick={closeMenu}>Marketplace</MobileLink>
                  <MobileLink href="/demo" onClick={closeMenu}>Try Demo</MobileLink>
                  <MobileLink href="https://raveculture.mintlify.app" onClick={closeMenu}>Docs</MobileLink>
                </MobileSection>
                <MobileSection label="Community">
                  <MobileLink href="/blog" onClick={closeMenu}>Blog</MobileLink>
                  <MobileLink href="/news" onClick={closeMenu}>News</MobileLink>
                  <MobileLink href="/token" onClick={closeMenu}>$AGENTBOT</MobileLink>
                  <MobileLink href="/basefm" onClick={closeMenu}>$BASEFM</MobileLink>
                  <MobileLink href="/partner" onClick={closeMenu}>Partner</MobileLink>
                </MobileSection>
                <div className="border-t border-gray-800 mt-3 pt-4 flex flex-col gap-2">
                  <Link href="/login" onClick={closeMenu} className="block text-center py-3 px-4 text-white rounded-xl border border-gray-700 hover:bg-gray-900 font-medium">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={closeMenu} className="block text-center py-3 px-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-200">
                    Get Started Free
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
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
        isActive ? 'text-white bg-white/[0.08]' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-800 first:border-0 mt-2 first:mt-0 pt-3 first:pt-0">
      <p className="text-[11px] text-gray-600 px-3 pb-1 uppercase tracking-wider font-medium">{label}</p>
      {children}
    </div>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block text-base py-2.5 px-3 text-gray-300 hover:text-white rounded-lg hover:bg-gray-900 active:bg-gray-800">
      {children}
    </Link>
  );
}
