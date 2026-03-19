"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { signIn } from "next-auth/react";

const SignInWithBase = dynamic(() => import("@/app/components/SignInWithBase"), {
  ssr: false,
  loading: () => <div className="h-11 w-full bg-zinc-900 animate-pulse" />,
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
      body: JSON.stringify({ email, password, name, referralCode, useMusicWizard: true }),
    });
    if (!res.ok) {
      let errorMsg = "Signup failed";
      try {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        }
      } catch {
        errorMsg = `Server error: ${res.status}`;
      }
      setError(errorMsg);
      setLoading(false);
      return;
    }

    const loginRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (loginRes?.error) {
      setError("Signup succeeded, but login failed");
    } else if (loginRes?.ok) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Create Account</div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Sign up for<br /><span className="text-zinc-700">Agentbot</span></h1>
        </div>

        {showReferralBadge && (
          <div className="text-center">
            <span className="inline-block border border-zinc-800 text-zinc-400 px-3 py-1 text-[10px] uppercase tracking-widest">
              Referral discount applied
            </span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          <div>
            <label htmlFor="name" className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {error && <div className="p-3 border border-red-500/20 text-red-400 text-xs text-center font-mono">{error}</div>}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-900"></div>
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-zinc-900"></div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <SignInWithBase redirectTo="/onboard" onError={(msg: string) => setError(msg)} />
          </div>
          <button
            className="w-full flex items-center justify-center gap-3 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white py-3 px-4 text-xs font-bold uppercase tracking-widest transition-colors"
            onClick={() => signIn("google", { callbackUrl: "/onboard" })}
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-zinc-500 text-[11px] uppercase tracking-wider">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
