"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
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
    <nav className="w-full flex items-center justify-between px-4 py-4 fixed top-0 z-50 bg-black border-b border-gray-900">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-medium text-white flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="hidden sm:inline">Agentbot</span>
        </Link>
      </div>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6">
        <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</Link>
        <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white transition-colors">Marketplace</Link>
        
        {status === "loading" ? null : session ? (
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <button 
              className="text-sm text-gray-400 hover:text-white" 
              onClick={() => signOut()}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm bg-white text-black px-3 py-1.5 font-medium rounded hover:bg-gray-200 transition-colors">
              Sign up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2" 
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
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
        <div className="md:hidden fixed inset-0 top-[57px] bg-black z-40 p-4">
          <div className="flex flex-col gap-4">
            <Link href="/docs" className="text-lg py-3 text-gray-300" onClick={() => setMenuOpen(false)}>Docs</Link>
            <Link href="/marketplace" className="text-lg py-3 text-gray-300" onClick={() => setMenuOpen(false)}>Marketplace</Link>
            <div className="border-t border-gray-800 pt-4">
              {session ? (
                <>
                  <div className="text-sm text-gray-500 pb-2">{session.user?.email}</div>
                  <Link href="/dashboard" className="block text-lg py-3 text-gray-300" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <button onClick={() => { setMenuOpen(false); signOut(); }} className="text-left text-lg py-3 text-gray-300">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-lg py-3 text-gray-300" onClick={() => setMenuOpen(false)}>Log in</Link>
                  <Link href="/signup" className="block text-lg py-3 text-white font-medium" onClick={() => setMenuOpen(false)}>Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
