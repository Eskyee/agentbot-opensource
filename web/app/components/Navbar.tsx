'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCustomSession, customSignOut } from '@/app/lib/useCustomSession';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useBasename, getWalletAddress } from '@/app/hooks/useBasename';

const PRODUCT_LINKS: { href: string; label: string; desc: string; external?: boolean }[] = [
  { href: '/eve', label: 'Eve', desc: 'Durable agent on the eve framework' },
  { href: '/open-agents', label: 'Open Agents', desc: 'Open-source AI agents' },
  { href: '/playground', label: 'Playground', desc: 'Flagship AI app builder' },
  { href: '/openclaw', label: 'OpenClaw', desc: 'The 24/7 agent runtime' },
  { href: '/chat', label: 'Chat', desc: 'Talk to Atlas anywhere' },
  { href: '/vercel-gateway', label: 'Gateway', desc: 'OpenAI-compatible LLM API' },
  { href: '/dashboard/dj-stream', label: 'DJ Stream', desc: 'Live DJ streaming platform' },
];

const MORE_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: '/documentation/products', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/agents', label: 'Agents' },
  { href: '/social', label: 'Social' },
  { href: '/partner/openrouter', label: 'OpenRouter' },
  { href: '/partner/mimo', label: 'MiMo' },
  { href: 'https://basefm.space', label: 'baseFM', external: true },
];

export default function Navbar() {
  const { data: session, status } = useCustomSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
      if (productsRef.current && !productsRef.current.contains(e.target as Node))
        setProductsOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    setProductsOpen(false);
    setUserMenuOpen(false);
    setMoreOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const isAdmin = session?.user?.isAdmin === true;
  const walletAddress = getWalletAddress(session?.user?.email);
  const { basename } = useBasename(walletAddress);
  const displayName =
    basename ??
    (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : null) ??
    session?.user?.name ??
    session?.user?.email?.split('@')[0] ??
    null;
  const closeMenu = () => setMenuOpen(false);
  const isLoggedIn = mounted && session;

  return (
    <>
      <nav className="w-full flex items-center justify-between px-4 sm:px-6 h-14 fixed top-0 z-50 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.94))] border-b border-zinc-800/50 font-mono backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={closeMenu}>
          <span className="text-xl leading-none">🦞</span>
          <span className="text-xs font-bold uppercase tracking-widest text-white">Agentbot</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {!mounted || status === 'loading' ? (
            <div className="flex gap-6" aria-hidden>
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-14 h-3" />
              ))}
            </div>
          ) : isLoggedIn ? (
            <>
              <NavLink href="/dashboard" current={pathname}>
                Dashboard
              </NavLink>
              <ProductsDropdown
                open={productsOpen}
                setOpen={setProductsOpen}
                dropdownRef={productsRef}
                current={pathname}
              />
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
                >
                  More
                  <svg
                    className={`w-2.5 h-2.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2.5 4.5L6 8l3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-zinc-950 border border-zinc-800 rounded-lg py-2 shadow-xl z-50">
                    {MORE_LINKS.map((link) =>
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ProductsDropdown
                open={productsOpen}
                setOpen={setProductsOpen}
                dropdownRef={productsRef}
                current={pathname}
              />
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
                >
                  More
                  <svg
                    className={`w-2.5 h-2.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2.5 4.5L6 8l3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-zinc-950 border border-zinc-800 rounded-lg py-2 shadow-xl z-50">
                    {MORE_LINKS.map((link) =>
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {!mounted || status === 'loading' ? (
            <div className="w-24 h-8" />
          ) : isLoggedIn ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-[11px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                <span className="truncate max-w-[100px]">{displayName}</span>
                <svg
                  className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2.5 4.5L6 8l3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg py-2 shadow-xl z-50">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  >
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-[11px] text-orange-500 hover:bg-zinc-900 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  <hr className="border-zinc-800 my-1" />
                  <button
                    onClick={() => customSignOut()}
                    className="w-full text-left px-4 py-2 text-[11px] text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-white text-black px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Deploy Agent
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 -mr-2"
          aria-label="Open menu"
        >
          <svg
            className="w-4 h-4 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={closeMenu} />
          <div className="absolute top-14 left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-4 space-y-1 max-h-[calc(100vh-56px)] overflow-y-auto">
            {isLoggedIn ? (
              <>
                <MobileLink href="/dashboard" onClick={closeMenu}>
                  Dashboard
                </MobileLink>
                <MobileLink href="/settings" onClick={closeMenu}>
                  Settings
                </MobileLink>
                {isAdmin && (
                  <MobileLink href="/admin" onClick={closeMenu}>
                    Admin
                  </MobileLink>
                )}
                <hr className="border-zinc-800 my-2" />
                <MobileSection>Products</MobileSection>
                {PRODUCT_LINKS.map((l) =>
                  l.external ? (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMenu}
                      className="block px-3 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <MobileLink key={l.href} href={l.href} onClick={closeMenu}>
                      {l.label}
                    </MobileLink>
                  )
                )}
                <hr className="border-zinc-800 my-2" />
                <button
                  onClick={() => {
                    customSignOut();
                    closeMenu();
                  }}
                  className="block w-full text-left px-3 py-2 text-[11px] text-red-400 hover:bg-zinc-900 rounded transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <MobileSection>Products</MobileSection>
                {PRODUCT_LINKS.map((l) =>
                  l.external ? (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMenu}
                      className="block px-3 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <MobileLink key={l.href} href={l.href} onClick={closeMenu}>
                      {l.label}
                    </MobileLink>
                  )
                )}
                <hr className="border-zinc-800 my-2" />
                <MobileSection>More</MobileSection>
                {MORE_LINKS.map((l) =>
                  l.external ? (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMenu}
                      className="block px-3 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <MobileLink key={l.href} href={l.href} onClick={closeMenu}>
                      {l.label}
                    </MobileLink>
                  )
                )}
                <hr className="border-zinc-800 my-2" />
                <MobileLink href="/login" onClick={closeMenu}>
                  Sign In
                </MobileLink>
                <MobileLink href="/signup" onClick={closeMenu}>
                  Deploy Agent
                </MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-[11px] uppercase tracking-wider transition-colors ${
        current.startsWith(href) ? 'text-white' : 'text-zinc-500 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1 text-[9px] uppercase tracking-widest text-zinc-500">{children}</div>
  );
}

function ProductsDropdown({
  open,
  setOpen,
  dropdownRef,
  current,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  current: string;
}) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
      >
        Products
        <svg
          className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-lg py-2 shadow-xl z-50">
          {PRODUCT_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                {link.label}
                <span className="block text-[9px] text-zinc-500 mt-0.5">{link.desc}</span>
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                {link.label}
                <span className="block text-[9px] text-zinc-500 mt-0.5">{link.desc}</span>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
