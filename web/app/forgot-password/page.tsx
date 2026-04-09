"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white selection:bg-blue-500/30 font-mono">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
          <div>
            <div className="text-5xl mb-4">✉️</div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase mb-2">Check your email</h1>
            <p className="text-sm text-zinc-400 mb-6">
              We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong>
            </p>
            <Link
              href="/login"
              className="block w-full bg-white text-black py-3 text-left text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white selection:bg-blue-500/30 font-mono">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Password Reset</div>
        <h1 className="text-2xl font-bold tracking-tighter uppercase mb-2">Reset Password</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Enter your email and we&apos;ll send you a reset link
        </p>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
              placeholder="you@example.com"
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button
            type="submit"
            className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="mt-6 text-zinc-500 text-xs">
          Remember your password?{' '}
          <Link href="/login" className="text-white hover:text-zinc-300">Log in</Link>
        </p>
      </div>
    </main>
  );
}
