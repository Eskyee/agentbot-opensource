"use client";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const SignInWithBase = dynamic(() => import("@/app/components/SignInWithBase"), {
  ssr: false,
  loading: () => <div className="h-11 w-44 bg-zinc-800 animate-pulse" />,
});

function LoginForm() {
  const { data: session, status } = useCustomSession()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      if (error === 'OAuthCallback') {
        setLoginError('Authentication failed. Please try again.')
      } else if (error === 'OAuthAccountNotLinked') {
        setLoginError('This email is already associated with another account.')
      } else if (error === 'AccessDenied') {
        setLoginError('Access denied. Please try again.')
      } else {
        setLoginError(decodeURIComponent(error))
      }
    }
  }, [error])

  useEffect(() => {
    if (session && status === 'authenticated') {
      window.location.href = '/dashboard'
    }
  }, [session, status])

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (data?.error) {
        setLoginError(data.error);
      } else if (data?.ok) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setLoading(false);
      setLoginError("Login failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 font-mono">
      <div className="text-center mb-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Authentication</div>
        <h1 className="text-2xl font-bold tracking-tighter uppercase">Welcome to Agentbot</h1>
        <p className="text-zinc-500 text-xs mt-2">One click to sign in</p>
      </div>

      <div className="mb-4 flex justify-center">
        <SignInWithBase callbackUrl="/dashboard" />
      </div>

      <details className="mt-4">
        <summary className="text-center text-zinc-500 text-xs uppercase tracking-widest cursor-pointer hover:text-white">
          Sign in with email instead
        </summary>
        <form className="mt-4 space-y-4" onSubmit={handleCredentialsLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            disabled={loading}
          >
            Continue
          </button>
        </form>
      </details>

      {loginError && (
        <div className="mt-4 p-3 border border-red-500/30 text-red-400 text-xs text-center">
          {loginError}
        </div>
      )}

      <p className="mt-6 text-center text-zinc-600 text-[10px] uppercase tracking-widest">
        By continuing, you agree to Agentbot&apos;s Terms
      </p>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
      <h1 className="text-2xl font-bold mb-6 text-center tracking-tighter uppercase">Log in to Agentbot</h1>
      <div className="animate-pulse space-y-5">
        <div className="h-10 bg-zinc-800"></div>
        <div className="h-10 bg-zinc-800"></div>
        <div className="h-12 bg-zinc-800"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black font-mono">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
