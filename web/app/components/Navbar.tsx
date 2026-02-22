"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

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
    <nav className={`w-full flex items-center justify-between px-4 py-3 fixed top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-900/50`}>
      <div className="flex items-center gap-3">
        <Link href="/" className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="hidden sm:inline">Agentbot</span>
        </Link>
      </div>

      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors" 
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <svg className="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        <Link href="/docs" className="px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors">Docs</Link>
        <Link href="/marketplace" className="px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors">Marketplace</Link>
        <div className="ml-2">
          <ThemeToggle />
        </div>
        
        {status === "loading" ? null : session ? (
          <div className="flex items-center gap-2 ml-2">
            <Link href="/dashboard" className="text-sm px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
              Dashboard
            </Link>
            <button 
              className="text-sm px-3 py-1.5 text-gray-300 hover:text-white" 
              onClick={() => signOut()}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 ml-2">
            <Link 
              href="/login" 
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="px-3 py-1.5 text-sm bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      <div 
        className={`md:hidden fixed inset-0 top-[60px] bg-gray-950 z-40 transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ display: menuOpen ? "block" : "none" }}
      >
        <div className="p-4 flex flex-col gap-2">
          <Link 
            href="/docs" 
            className="px-4 py-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Docs
          </Link>
          <Link 
            href="/marketplace" 
            className="px-4 py-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Marketplace
          </Link>
          <div className="px-4 py-4">
            <ThemeToggle />
          </div>
          <div className="border-t border-gray-800 my-2" />
          {session ? (
            <>
              <div className="px-4 py-2 text-sm text-gray-400">{session.user?.email}</div>
              <Link 
                href="/dashboard" 
                className="px-4 py-4 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button 
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="text-left px-4 py-4 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-4 py-4 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-4 text-center bg-white text-black font-medium rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Overlay */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 top-[60px] bg-black/80 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}
