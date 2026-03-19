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
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Password Reset</h1>
          <p className="text-gray-400 mb-6">
            Your password has been reset successfully!
          </p>
          <Link
            href="/login"
            className="inline-block w-full rounded-lg bg-green-500 hover:bg-green-400 py-3 font-bold text-black transition-colors"
          >
            Log in with new password
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/forgot-password"
            className="inline-block w-full rounded-lg bg-green-500 hover:bg-green-400 py-3 font-bold text-black transition-colors"
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
      <h1 className="text-2xl font-bold mb-2 text-center">New Password</h1>
      <p className="text-gray-400 mb-6 text-center">
        Enter your new password below
      </p>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-gray-300 mb-1">New Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-gray-300 mb-1">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="w-full rounded-lg bg-green-500 hover:bg-green-400 py-3 font-bold text-black transition-colors"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      <p className="mt-6 text-center text-gray-400">
        Need a new link?{' '}
        <Link href="/forgot-password" className="text-white hover:underline">Request again</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <Suspense fallback={
        <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
          <div className="animate-pulse space-y-5">
            <div className="h-10 bg-gray-800 rounded-lg"></div>
            <div className="h-10 bg-gray-800 rounded-lg"></div>
            <div className="h-12 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
