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
        <Link href="/why" className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors">Why Agentbot?</Link>
        <Link href="/pricing" className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors">Pricing</Link>
        <Link href="/blog" className="text-sm text-gray-7 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 rounded transition-colors">Blog</Link>
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
        <>
          {/* Backdrop overlay */}
          <div 
            className="md:hidden fixed inset-0 top-[57px] bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <div className="md:hidden fixed top-[57px] right-0 bottom-0 w-[320px] bg-gray-900 z-50 p-8 overflow-y-auto shadow-2xl">
            <div className="flex flex-col gap-2">
              <Link 
                href="/why" 
                className="text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium" 
                onClick={() => setMenuOpen(false)}
              >
                Why Agentbot?
              </Link>
              <Link 
                href="/pricing" 
                className="text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium" 
                onClick={() => setMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/blog" 
                className="text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium" 
                onClick={() => setMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/docs" 
                className="text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium" 
                onClick={() => setMenuOpen(false)}
              >
                Docs
              </Link>
              <Link 
                href="/marketplace" 
                className="text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium" 
                onClick={() => setMenuOpen(false)}
              >
                Marketplace
              </Link>
              
              <div className="border-t border-gray-700 my-4" />
              
              {session ? (
                <>
                  <div className="px-4 py-2 text-xs text-gray-400 truncate">{session.user?.email}</div>
                  <Link 
                    href="/dashboard" 
                    className="text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => { setMenuOpen(false); signOut(); }} 
                    className="text-left text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-lg py-5 px-4 text-white hover:bg-gray-800 rounded-md transition-colors font-medium" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/signup" 
                    className="text-lg py-5 px-4 bg-white text-black font-semibold rounded-md hover:bg-gray-100 transition-colors text-center mt-2" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
