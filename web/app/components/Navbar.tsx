"use client";
import Link from "next/link";
import Image from "next/image";
import { useCustomSession, customSignOut } from "@/app/lib/useCustomSession";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useBasename, getWalletAddress } from "@/app/hooks/useBasename";
import { SOUL_DASHBOARD_URL } from "@/app/lib/platform-urls";
import { NotificationBell } from "@/app/social/_components/NotificationBell";

// ─── Nav structure ────────────────────────────────────────────────────────────
// Logged-out: Explore ▾ | Build ▾ | Community ▾ | Pricing (flat)
//   — grouped by user intent, not taxonomy
//   — Pricing stays flat (highest-intent conversion page)
// Logged-in:  task-focused — Dashboard, baseFM, Agents, Network ▾

const EXPLORE_LINKS = [
  { href: "/demo",        label: "Demo",         detail: "See Agentbot in action" },
  { href: "/showcase",    label: "Showcase",     detail: "Meet agents built on Agentbot" },
  { href: "/why",         label: "Why Agentbot", detail: "The case for agent infrastructure" },
  { href: "/basefm/live", label: "baseFM Live",  detail: "Live underground radio — on now" },
  { href: "/search",      label: "Search",       detail: "Search docs, guides and blog" },
  { href: "/social",      label: "Social",       detail: "Agent network for creatives" },
  { href: "/agents",      label: "Agents",       detail: "Browse available agents" },
  { href: "/marketplace", label: "Marketplace",  detail: "Skills, tools and integrations" },
  { href: "/advertise",   label: "Sponsor",      detail: "Reach the underground" },
]

const BUILD_LINKS = [
  { href: "/documentation", label: "Docs",        detail: "Platform documentation" },
  { href: "/guide",          label: "Guide",       detail: "Dashboard, skills and OpenClaw" },
  { href: SOUL_DASHBOARD_URL, label: "Borg",       detail: "Soul dashboard for agents", external: true },
  { href: "/skills",         label: "Skills API",  detail: "Build and publish agent skills" },
  { href: "https://github.com/Eskyee/agentbot-opensource", label: "Open Source", detail: "GitHub — MIT licensed", external: true },
  { href: "https://deepwiki.com/Eskyee/agentbot-opensource", label: "DeepWiki", detail: "AI-generated codebase docs", external: true },
]

const COMMUNITY_LINKS = [
  { href: "/blog",    label: "Blog",         detail: "Updates, thinking and releases" },
  { href: "/news",    label: "News",         detail: "Platform and ecosystem news" },
  { href: "/jobs",    label: "Jobs",         detail: "Work with AI-native teams" },
  { href: "/token",   label: "$AGENTBOT",    detail: "Community token on Solana" },
  { href: "/claim",   label: "Claim Credits",detail: "Holders earn platform credits" },
  { href: "/buddies", label: "Buddies",      detail: "Agent network and community" },
]

const NETWORK_LINKS = [
  { href: "/dashboard/community",       label: "Community",       detail: "Rewards and governance" },
  { href: "/marketplace",               label: "Marketplace",     detail: "Skills and integrations" },
  { href: "/jobs",                      label: "Jobs",            detail: "Opportunities" },
  { href: "/dashboard/gitlawb-network", label: "Gitlawb Network", detail: "Decentralised repos" },
  { href: "/dashboard/git-city",        label: "Git City",        detail: "Agent collaboration" },
  { href: SOUL_DASHBOARD_URL,           label: "Borg",            detail: "Soul dashboard", external: true },
]

type DropdownItem = { href: string; label: string; detail: string; external?: boolean }

// ─── Dropdown component ───────────────────────────────────────────────────────
function Dropdown({ label, items, current }: { label: string; items: DropdownItem[]; current: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = items.some((i) => current === i.href || current.startsWith(i.href + '/'))

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [current])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 text-[11px] uppercase tracking-widest transition-colors ${
          isActive || open ? 'text-white' : 'text-zinc-500 hover:text-white'
        }`}
      >
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl z-50 overflow-hidden">
          <div className="py-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex flex-col px-4 py-2.5 hover:bg-zinc-900 transition-colors group"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                  {item.label}
                </span>
                <span className="text-[10px] text-zinc-600 mt-0.5 normal-case tracking-normal">
                  {item.detail}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────
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
    ?? (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : null)
    ?? session?.user?.name
    ?? session?.user?.email?.split('@')[0]
    ?? null;

  const closeMenu = () => setMenuOpen(false);
  const isLoggedIn = mounted && session;

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 h-14 fixed top-0 z-50 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.94))] border-b border-zinc-800/50 font-mono backdrop-blur-sm shadow-[inset_0_-1px_0_rgba(24,24,27,0.4)]">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={closeMenu}>
          <Image src="/icons/icon-192x192.png" alt="Agentbot" width={22} height={22} priority className="rounded" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Agentbot</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-7">
          {!mounted || status === "loading" ? (
            <div className="flex gap-6">
              {[1,2,3,4].map(i => <div key={i} className="w-16 h-3 bg-zinc-900 animate-pulse rounded" />)}
            </div>
          ) : isLoggedIn ? (
            // Logged-in: task-focused
            <>
              <NavLink href="/dashboard" current={pathname}>Dashboard</NavLink>
              <NavLink href="/basefm/live" current={pathname}>baseFM</NavLink>
              <NavLink href="/social" current={pathname}>Social</NavLink>
              <NavLink href="/agents" current={pathname}>Agents</NavLink>
              <NavLink href="/colony" current={pathname}>Colony</NavLink>
              <Dropdown label="Network" items={NETWORK_LINKS} current={pathname} />
              <NotificationBell />
            </>
          ) : (
            // Logged-out: intent-focused
            <>
              <Dropdown label="Explore"    items={EXPLORE_LINKS}    current={pathname} />
              <Dropdown label="Build"      items={BUILD_LINKS}      current={pathname} />
              <NavLink href="/documentation" current={pathname}>Docs</NavLink>
              <Dropdown label="Community"  items={COMMUNITY_LINKS}  current={pathname} />
              <NavLink href="/blog" current={pathname}>Blog</NavLink>
              <NavLink href="/pricing" current={pathname}>Pricing</NavLink>
            </>
          )}
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {!mounted || status === "loading" ? (
            <div className="w-24 h-8" />
          ) : isLoggedIn ? (
            <>
              <Link
                href="/claim"
                className="text-[11px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                Claim
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider">
                  Admin
                </Link>
              )}
              <span className="text-[11px] text-zinc-600 truncate max-w-[100px] uppercase tracking-wider">{displayName}</span>
              <button
                onClick={() => customSignOut()}
                className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/guide" className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider">
                Guide
              </Link>
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
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="lg:hidden fixed inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,1))] z-[60] overflow-y-auto font-mono" style={{ top: 56 }}>
          <div className="flex flex-col p-6 gap-1 pb-12">
            {isLoggedIn ? (
              <>
                <MobileSection label="Primary" defaultOpen>
                  <MobileLink href="/dashboard" onClick={closeMenu}>Dashboard</MobileLink>
                  <MobileLink href="/dashboard/signals" onClick={closeMenu}>Signals</MobileLink>
                  <MobileLink href="/dashboard/skills" onClick={closeMenu}>Skills</MobileLink>
                  <MobileLink href="/dashboard/wallet" onClick={closeMenu}>Wallet</MobileLink>
                  <MobileLink href="/dashboard/workflows" onClick={closeMenu}>Workflows</MobileLink>
                  <MobileLink href="/dashboard/verify" onClick={closeMenu}>Verify</MobileLink>
                </MobileSection>
                <MobileSection label="Explore">
                  <MobileLink href="/basefm/live" onClick={closeMenu}>baseFM Live</MobileLink>
                  <MobileLink href="/social" onClick={closeMenu}>Social</MobileLink>
                  <MobileLink href="/agents" onClick={closeMenu}>Agents</MobileLink>
                  <MobileLink href="/colony" onClick={closeMenu}>Colony</MobileLink>
                  <MobileLink href="/marketplace" onClick={closeMenu}>Marketplace</MobileLink>
                  <MobileLink href="/dashboard/community" onClick={closeMenu}>Community</MobileLink>
                  <MobileLink href="/jobs" onClick={closeMenu}>Jobs</MobileLink>
                  <MobileLink href="/search" onClick={closeMenu}>Search</MobileLink>
                </MobileSection>
                <MobileSection label="Advanced">
                  <MobileLink href="/basefm" onClick={closeMenu}>DJ Streaming</MobileLink>
                  <MobileLink href="/dashboard/mixtape" onClick={closeMenu}>Mix Uploads</MobileLink>
                  <MobileLink href="/dashboard/gitlawb-network" onClick={closeMenu}>Gitlawb Network</MobileLink>
                  <MobileLink href="/dashboard/git-city" onClick={closeMenu}>Git City</MobileLink>
                  <MobileLink href={SOUL_DASHBOARD_URL} onClick={closeMenu} external>Borg</MobileLink>
                  <MobileLink href="/advertise" onClick={closeMenu}>Advertise</MobileLink>
                </MobileSection>
                <MobileSection label="Account" defaultOpen>
                  <MobileLink href="/claim" onClick={closeMenu}>Claim Credits</MobileLink>
                  <MobileLink href="/billing" onClick={closeMenu}>Billing</MobileLink>
                  <MobileLink href="/settings" onClick={closeMenu}>Settings</MobileLink>
                  {isAdmin && <MobileLink href="/admin" onClick={closeMenu}>Admin</MobileLink>}
                  {displayName && <div className="text-[10px] text-zinc-600 px-3 py-2 uppercase tracking-widest">{displayName}</div>}
                  <button
                    onClick={() => { closeMenu(); customSignOut(); }}
                    className="text-left text-xs py-2.5 px-3 text-zinc-500 hover:text-white w-full uppercase tracking-wider"
                  >
                    Sign out
                  </button>
                </MobileSection>
              </>
            ) : (
              <>
                <MobileSection label="Explore" defaultOpen>
                  <MobileLink href="/demo" onClick={closeMenu}>Demo</MobileLink>
                  <MobileLink href="/showcase" onClick={closeMenu}>Showcase</MobileLink>
                  <MobileLink href="/why" onClick={closeMenu}>Why Agentbot</MobileLink>
                  <MobileLink href="/basefm/live" onClick={closeMenu}>baseFM Live</MobileLink>
                  <MobileLink href="/agents" onClick={closeMenu}>Agents</MobileLink>
                  <MobileLink href="/marketplace" onClick={closeMenu}>Marketplace</MobileLink>
                  <MobileLink href="/pricing" onClick={closeMenu}>Pricing</MobileLink>
                  <MobileLink href="/advertise" onClick={closeMenu}>Sponsor</MobileLink>
                </MobileSection>
                <MobileSection label="Build">
                  <MobileLink href="/documentation" onClick={closeMenu}>Docs</MobileLink>
                  <MobileLink href="/guide" onClick={closeMenu}>Guide</MobileLink>
                  <MobileLink href={SOUL_DASHBOARD_URL} onClick={closeMenu} external>Borg</MobileLink>
                  <MobileLink href="/skills" onClick={closeMenu}>Skills API</MobileLink>
                  <MobileLink href="https://github.com/Eskyee/agentbot-opensource" onClick={closeMenu} external>Open Source</MobileLink>
                </MobileSection>
                <MobileSection label="Community">
                  <MobileLink href="/blog" onClick={closeMenu}>Blog</MobileLink>
                  <MobileLink href="/news" onClick={closeMenu}>News</MobileLink>
                  <MobileLink href="/jobs" onClick={closeMenu}>Jobs</MobileLink>
                  <MobileLink href="/token" onClick={closeMenu}>$AGENTBOT Token</MobileLink>
                  <MobileLink href="/claim" onClick={closeMenu}>Claim Credits</MobileLink>
                  <MobileLink href="/buddies" onClick={closeMenu}>Buddies</MobileLink>
                </MobileSection>
                <div className="border-t border-zinc-900 mt-4 pt-6 flex flex-col gap-3">
                  <Link href="/login" onClick={closeMenu} className="block text-center py-3 text-zinc-400 border border-zinc-800 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors">
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={closeMenu} className="block text-center py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
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
      className={`text-[11px] uppercase tracking-widest transition-colors ${
        isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileSection({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-zinc-900 first:border-0 mt-3 first:mt-0 pt-4 first:pt-0">
      <button
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between px-3 pb-2"
      >
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest">{label}</p>
        <span className={`text-[10px] text-zinc-600 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open ? children : null}
    </div>
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
