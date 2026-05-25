"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useBasename, getWalletAddress } from "@/app/hooks/useBasename";
import { customSignOut, useCustomSession } from "@/app/lib/useCustomSession";

const PUBLIC_LINKS = [
  { href: "/playground", label: "Playground" },
  { href: "/creator-toolkit", label: "Creator Toolkit" },
  { href: "/opengateway", label: "OpenGateway" },
  { href: "/pricing", label: "Pricing" },
];

const APP_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/creator", label: "Creator Console" },
  { href: "/playground", label: "Playground" },
  { href: "/opengateway", label: "OpenGateway" },
];

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
    function handler(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdmin = session?.user?.isAdmin === true;
  const walletAddress = getWalletAddress(session?.user?.email);
  const { basename } = useBasename(walletAddress);
  const displayName = basename
    ?? (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null)
    ?? session?.user?.name
    ?? session?.user?.email?.split("@")[0]
    ?? null;

  const isLoggedIn = mounted && session;
  const navLinks = isLoggedIn ? APP_LINKS : PUBLIC_LINKS;
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-zinc-900 bg-black px-5 font-mono">
        <Link href="/" className="flex shrink-0 items-baseline gap-2" onClick={closeMenu}>
          <span className="text-xs font-bold lowercase tracking-tight text-white">agentbot</span>
          <span className="hidden text-[10px] uppercase tracking-widest text-zinc-700 sm:inline">v0.1 alpha</span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {!mounted || status === "loading" ? (
            <span className="text-[11px] lowercase text-zinc-700">loading</span>
          ) : (
            navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} current={pathname}>
                {link.label}
              </NavLink>
            ))
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          {!mounted || status === "loading" ? (
            <span className="text-[11px] lowercase text-zinc-700">auth</span>
          ) : isLoggedIn ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((value) => !value)}
                className="flex items-center gap-1 text-[11px] lowercase text-zinc-500 transition-colors hover:text-white"
              >
                <span className="max-w-[120px] truncate">{displayName}</span>
                <span className={`text-[10px] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {userMenuOpen ? (
                <div className="absolute right-0 top-full z-50 mt-3 w-44 border border-zinc-900 bg-black">
                  <div className="border-b border-zinc-900 px-4 py-2.5">
                    <span className="text-[10px] lowercase text-zinc-600">{displayName}</span>
                  </div>
                  <UserMenuLink href="/billing" onClick={() => setUserMenuOpen(false)}>Billing</UserMenuLink>
                  <UserMenuLink href="/settings" onClick={() => setUserMenuOpen(false)}>Settings</UserMenuLink>
                  {isAdmin ? <UserMenuLink href="/dashboard/admin" onClick={() => setUserMenuOpen(false)}>Admin</UserMenuLink> : null}
                  <button
                    onClick={() => { setUserMenuOpen(false); customSignOut(); }}
                    className="block w-full border-t border-zinc-900 px-4 py-2.5 text-left text-[11px] lowercase text-zinc-500 transition-colors hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-[11px] lowercase text-zinc-500 transition-colors hover:text-white">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="border border-orange-500/40 bg-orange-500 px-3 py-1.5 text-[11px] font-bold lowercase text-black transition-colors hover:border-orange-400 hover:bg-orange-400"
              >
                Start
              </Link>
            </>
          )}
        </div>

        <button
          className="-mr-2 p-2 lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] overflow-y-auto border-t border-zinc-900 bg-black font-mono lg:hidden" style={{ top: 48 }}>
          <div className="flex flex-col gap-1 p-5 pb-10">
            {navLinks.map((link) => (
              <MobileLink key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </MobileLink>
            ))}

            <div className="mt-4 border-t border-zinc-900 pt-4">
              {isLoggedIn ? (
                <>
                  {displayName ? <div className="px-3 pb-2 text-[10px] lowercase text-zinc-600">{displayName}</div> : null}
                  <MobileLink href="/billing" onClick={closeMenu}>Billing</MobileLink>
                  <MobileLink href="/settings" onClick={closeMenu}>Settings</MobileLink>
                  {isAdmin ? <MobileLink href="/dashboard/admin" onClick={closeMenu}>Admin</MobileLink> : null}
                  <button
                    onClick={() => { closeMenu(); customSignOut(); }}
                    className="w-full px-3 py-2.5 text-left text-xs lowercase text-zinc-500 hover:text-white"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <Link href="/login" onClick={closeMenu} className="block px-3 py-2.5 text-xs lowercase text-zinc-500 transition-colors hover:text-white">
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="mt-2 block bg-orange-500 px-3 py-2.5 text-xs font-bold lowercase text-black transition-colors hover:bg-orange-400"
                  >
                    Start
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const isActive = current === href || current.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`text-[11px] lowercase transition-colors ${
        isActive ? "text-white" : "text-zinc-500 hover:text-white"
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
      className="block px-4 py-2.5 text-[11px] lowercase text-zinc-500 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 text-xs lowercase text-zinc-500 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}
