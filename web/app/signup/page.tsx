"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { signIn } from "next-auth/react";

const SignInWithBase = dynamic(() => import("@/app/components/SignInWithBase"), {
  ssr: false,
  loading: () => <div className="h-11 w-full rounded-lg bg-gray-800 animate-pulse" />,
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
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
        <h1 className="text-2xl font-bold mb-2 text-center">Sign up for Agentbot</h1>
        {showReferralBadge && (
          <div className="text-center mb-4">
            <span className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
              🎉 £10 discount applied!
            </span>
          </div>
        )}
        <form className="space-y-5" onSubmit={handleSignup}>
          <div>
            <label htmlFor="name" className="block text-gray-300 mb-1">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-white py-2 font-semibold text-gray-900 hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        <div className="my-6 flex items-center justify-center gap-2 text-gray-400">
          <span className="h-px w-10 bg-gray-700" />
          <span>or</span>
          <span className="h-px w-10 bg-gray-700" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-center">
            <SignInWithBase redirectTo="/onboard" onError={(msg) => setError(msg)} />
          </div>
          <button
            className="w-full rounded-lg bg-white text-gray-900 font-semibold py-2 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 transition-colors"
            onClick={() => signIn("google", { callbackUrl: "/onboard" })}
            disabled={loading}
          >
            <svg width="20" height="20" fill="currentColor" className="mr-2" viewBox="0 0 48 48"><path d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#4285F4"/><path d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4c-7.2 0-13.3 4.1-16.2 10.7z" fill="#34A853"/><path d="M24 44c5.1 0 9.8-1.7 13.4-4.7l-6.2-5.1C29.2 35.7 26.7 36 24 36c-6.1 0-10.7-2.8-11.7-7.5H6.3C9.2 39.9 15.3 44 24 44z" fill="#FBBC05"/><path d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </div>
        <p className="mt-8 text-center text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
