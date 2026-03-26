"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const SignInWithBase = dynamic(() => import("@/app/components/SignInWithBase"), {
  ssr: false,
  loading: () => <div className="h-11 w-full bg-zinc-800 animate-pulse" />,
});

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showReferralBadge, setShowReferralBadge] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      setShowReferralBadge(true);
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, referralCode }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }
    
    setLoading(false);
    window.location.href = "/login?registered=1";
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white selection:bg-blue-500/30 font-mono">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Create Account</div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Sign up for Agentbot</h1>
        </div>
        {showReferralBadge && (
          <div className="mb-6">
            <span className="inline-block border border-blue-500/30 text-blue-500 px-3 py-1 text-[10px] uppercase tracking-widest">
              Discount Applied
            </span>
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSignup}>
          <div>
            <label htmlFor="name" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
        {error && <div className="text-red-400 mt-4 text-xs">{error}</div>}
        <div className="my-6 flex items-center gap-2">
          <span className="h-px w-10 bg-zinc-800" />
          <span className="text-zinc-600 text-[10px] uppercase tracking-widest">or</span>
          <span className="h-px w-10 bg-zinc-800" />
        </div>
        <div className="flex flex-col gap-3">
          <SignInWithBase callbackUrl="/onboard" />
          <button
            className="w-full border border-zinc-800 text-white text-xs font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 transition-colors hover:border-zinc-600"
            onClick={() => window.location.href = "/api/auth/google"}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#4285F4"/><path d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4c-7.2 0-13.3 4.1-16.2 10.7z" fill="#34A853"/><path d="M24 44c5.1 0 9.8-1.7 13.4-4.7l-6.2-5.1C29.2 35.7 26.7 36 24 36c-6.1 0-10.7-2.8-11.7-7.5H6.3C9.2 39.9 15.3 44 24 44z" fill="#FBBC05"/></svg>
            Continue with Google
          </button>
        </div>
        <p className="mt-8 text-zinc-500 text-xs">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:text-zinc-300">Log in</Link>
        </p>
      </div>
    </main>
  );
}
