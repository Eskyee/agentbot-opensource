"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <nav className="w-full flex items-center justify-between px-4 py-3 fixed top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-3">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-medium text-white flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-8 rounded">
          <span className="text-2xl" role="img" aria-label="Lobster">🦞</span>
          <span className="hidden sm:inline">Agentbot</span>
        </Link>
      </div>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6">
        <Link href="/docs" className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors">Docs</Link>
        <Link href="/marketplace" className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors">Marketplace</Link>
        
        {status === "loading" ? null : session ? (
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors">
              Dashboard
            </Link>
            <button 
              className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors" 
              onClick={() => signOut()}
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="text-sm bg-white text-black px-3 py-1.5 font-medium rounded-lg hover:bg-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-8 rounded" 
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-black z-40 p-4 overscroll-contain">
          <div className="flex flex-col gap-4">
            <Link href="/docs" className="text-lg py-3 text-gray-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded" onClick={() => setMenuOpen(false)}>Docs</Link>
            <Link href="/marketplace" className="text-lg py-3 text-gray-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded" onClick={() => setMenuOpen(false)}>Marketplace</Link>
            <div className="border-t border-gray-3 pt-4">
              {session ? (
                <>
                  <div className="text-sm text-gray-6 pb-2">{session.user?.email}</div>
                  <Link href="/dashboard" className="block text-lg py-3 text-gray-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <button onClick={() => { setMenuOpen(false); signOut(); }} className="text-left text-lg py-3 text-gray-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded">Log Out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-lg py-3 text-gray-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded" onClick={() => setMenuOpen(false)}>Log In</Link>
                  <Link href="/signup" className="block text-lg py-3 text-white font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
