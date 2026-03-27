"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
        <div>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase mb-2">Password Reset</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Your password has been reset successfully!
          </p>
          <Link
            href="/login"
            className="block w-full bg-white text-black py-3 text-left text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Log in with new password
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
        <div>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase mb-2">Invalid Link</h1>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <Link
            href="/forgot-password"
            className="block w-full bg-white text-black py-3 text-left text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Password Reset</div>
      <h1 className="text-2xl font-bold tracking-tighter uppercase mb-2">New Password</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Enter your new password below
      </p>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">New Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        {error && <div className="text-red-400 text-xs">{error}</div>}
        <button
          type="submit"
          className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      <p className="mt-6 text-zinc-500 text-xs">
        Need a new link?{' '}
        <Link href="/forgot-password" className="text-white hover:text-zinc-300">Request again</Link>
      </p>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
      <div className="animate-pulse space-y-5">
        <div className="h-10 bg-zinc-800"></div>
        <div className="h-10 bg-zinc-800"></div>
        <div className="h-12 bg-zinc-800"></div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white selection:bg-blue-500/30 font-mono">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
