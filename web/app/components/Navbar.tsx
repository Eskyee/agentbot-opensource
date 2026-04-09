"use client";
import Link from "next/link";
import Image from "next/image";
import { useCustomSession, customSignOut } from "@/app/lib/useCustomSession";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useBasename, getWalletAddress } from "@/app/hooks/useBasename";
import { SOUL_DASHBOARD_URL } from "@/app/lib/platform-urls";

export default function Navbar() {
  const { data: session, status } = useCustomSession();
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

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 h-14 fixed top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-900 font-mono">
        <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
          <Image
            src="/icons/icon-192x192.png"
            alt="Agentbot"
            width={24}
            height={24}
            priority
            className="rounded"
          />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Agentbot</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!mounted || status === "loading" ? (
            <div className="flex gap-6">
              {[1,2,3,4].map(i => <div key={i} className="w-14 h-3 bg-zinc-900 animate-pulse" />)}
            </div>
          ) : isLoggedIn ? (
            <>
              <NavLink href="/dashboard" current={pathname}>Dashboard</NavLink>
              <NavLink href={SOUL_DASHBOARD_URL} current={pathname}>Borg</NavLink>
              <NavLink href="/jobs" current={pathname}>Jobs</NavLink>
              <NavLink href="/sponsor" current={pathname}>Sponsor</NavLink>
              <NavLink href="/news" current={pathname}>News</NavLink>
              <NavLink href="/blog" current={pathname}>Blog</NavLink>
              <NavLink href="/agents" current={pathname}>Agents</NavLink>
              <NavLink href="/marketplace" current={pathname}>Marketplace</NavLink>
              <NavLink href="/documentation" current={pathname}>Docs</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/pricing" current={pathname}>Pricing</NavLink>
              <NavLink href="/why" current={pathname}>Why</NavLink>
              <NavLink href={SOUL_DASHBOARD_URL} current={pathname}>Borg</NavLink>
              <NavLink href="/jobs" current={pathname}>Jobs</NavLink>
              <NavLink href="/sponsor" current={pathname}>Sponsor</NavLink>
              <NavLink href="/news" current={pathname}>News</NavLink>
              <NavLink href="/blog" current={pathname}>Blog</NavLink>
              <NavLink href="/agents" current={pathname}>Agents</NavLink>
              <NavLink href="/marketplace" current={pathname}>Marketplace</NavLink>
              <NavLink href="/demo" current={pathname}>Demo</NavLink>
              <NavLink href="/documentation" current={pathname}>Docs</NavLink>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {!mounted || status === "loading" ? (
            <div className="w-16 h-8" />
          ) : isLoggedIn ? (
            <>
              {isAdmin && <NavLink href="/admin" current={pathname}>Admin</NavLink>}
              <span className="text-[11px] text-zinc-500 truncate max-w-[120px] uppercase tracking-wider">{displayName}</span>
              <button
                onClick={() => customSignOut()}
                className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[11px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
                Log in
              </Link>
              <Link href="/signup" className="text-[11px] bg-white text-black px-4 py-1.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 bg-black z-[60] overflow-y-auto font-mono" style={{ top: 56 }}>
          <div className="flex flex-col p-6 gap-1">
            {isLoggedIn ? (
              <>
                <MobileSection label="Navigate">
                  <MobileLink href="/dashboard" onClick={closeMenu}>Dashboard</MobileLink>
                  <MobileLink href={SOUL_DASHBOARD_URL} onClick={closeMenu}>Borg</MobileLink>
                  <MobileLink href="/jobs" onClick={closeMenu}>Jobs</MobileLink>
                  <MobileLink href="/sponsor" onClick={closeMenu}>Sponsor</MobileLink>
                  <MobileLink href="/news" onClick={closeMenu}>News</MobileLink>
                  <MobileLink href="/blog" onClick={closeMenu}>Blog</MobileLink>
                  <MobileLink href="/agents" onClick={closeMenu}>Agents</MobileLink>
                  <MobileLink href="/marketplace" onClick={closeMenu}>Marketplace</MobileLink>
                  <MobileLink href="/documentation" onClick={closeMenu}>Docs</MobileLink>
                </MobileSection>
                <MobileSection label="Account">
                  {displayName && <div className="text-[10px] text-zinc-600 px-3 py-2 uppercase tracking-widest">{displayName}</div>}
                  <MobileLink href="/billing" onClick={closeMenu}>Billing</MobileLink>
                  <MobileLink href="/settings" onClick={closeMenu}>Settings</MobileLink>
                  {isAdmin && <MobileLink href="/admin" onClick={closeMenu}>Admin</MobileLink>}
                  <button
                    onClick={() => { closeMenu(); customSignOut(); }}
                    className="text-left text-xs py-2.5 px-3 text-zinc-500 hover:text-white w-full uppercase tracking-wider"
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
                  <MobileLink href={SOUL_DASHBOARD_URL} onClick={closeMenu}>Borg</MobileLink>
                  <MobileLink href="/jobs" onClick={closeMenu}>Jobs</MobileLink>
                  <MobileLink href="/sponsor" onClick={closeMenu}>Sponsor</MobileLink>
                  <MobileLink href="/agents" onClick={closeMenu}>Agent Templates</MobileLink>
                  <MobileLink href="/marketplace" onClick={closeMenu}>Marketplace</MobileLink>
                  <MobileLink href="/demo" onClick={closeMenu}>Try Demo</MobileLink>
                  <MobileLink href="https://docs.agentbot.raveculture.xyz" onClick={closeMenu}>Docs</MobileLink>
                </MobileSection>
                <MobileSection label="Community">
                  <MobileLink href="/blog" onClick={closeMenu}>Blog</MobileLink>
                  <MobileLink href="/news" onClick={closeMenu}>News</MobileLink>
                  <MobileLink href="/token" onClick={closeMenu}>$AGENTBOT</MobileLink>
                  <MobileLink href="/basefm" onClick={closeMenu}>$BASEFM</MobileLink>
                  <MobileLink href="/partner" onClick={closeMenu}>Partner</MobileLink>
                </MobileSection>
                <div className="border-t border-zinc-900 mt-4 pt-6 flex flex-col gap-3">
                  <Link href="/login" onClick={closeMenu} className="block text-center py-3 text-zinc-400 border border-zinc-800 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors">
                    Log in
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

function MobileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-900 first:border-0 mt-3 first:mt-0 pt-4 first:pt-0">
      <p className="text-[10px] text-zinc-700 px-3 pb-2 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block text-xs py-2.5 px-3 text-zinc-400 hover:text-white uppercase tracking-wider transition-colors">
      {children}
    </Link>
  );
}
