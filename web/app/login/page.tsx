"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      setLoginError(error === 'OAuthCallback' ? 'Authentication failed. Please try again.' : error)
    }
  }, [error])

  useEffect(() => {
    if (session) {
      window.location.href = '/dashboard'
    }
  }, [session])

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setLoginError("Invalid email or password");
    } else if (res?.ok) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-center">Log in to Agentbot</h1>
      <form className="space-y-5" onSubmit={handleCredentialsLogin}>
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
          className="w-full rounded-lg bg-green-500 hover:bg-green-400 py-3 font-bold text-black transition-colors"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      {loginError && <div className="text-red-500 text-center mt-2">{loginError}</div>}
      <div className="my-6 flex items-center justify-center gap-2 text-gray-400">
        <span className="h-px w-10 bg-gray-700" />
        <span>or</span>
        <span className="h-px w-10 bg-gray-700" />
      </div>
      <div className="flex flex-col gap-3">
        <button
          className="w-full rounded-lg bg-white hover:bg-gray-100 py-3 font-bold text-gray-900 flex items-center justify-center gap-2"
          onClick={() => signIn("google")}
          disabled={loading}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 48 48"><path d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#4285F4"/><path d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4c-7.2 0-13.3 4.1-16.2 10.7z" fill="#34A853"/><path d="M24 44c5.1 0 9.8-1.7 13.4-4.7l-6.2-5.1C29.2 35.7 26.7 36 24 36c-6.1 0-10.7-2.8-11.7-7.5H6.3C9.2 39.9 15.3 44 24 44z" fill="#FBBC05"/><path d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
        <button
          className="w-full rounded-lg bg-green-500 hover:bg-green-400 py-3 font-bold text-black flex items-center justify-center gap-2"
          onClick={() => signIn("github")}
          disabled={loading}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
          Continue with GitHub
        </button>
      </div>
      <p className="mt-8 text-center text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-white hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-center">Log in to Agentbot</h1>
      <div className="animate-pulse space-y-5">
        <div className="h-10 bg-gray-800 rounded-lg"></div>
        <div className="h-10 bg-gray-800 rounded-lg"></div>
        <div className="h-12 bg-gray-800 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
