"use client";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Authentication } from "@/lib/webauthx/client";

const SignInWithBase = dynamic(() => import("@/app/components/SignInWithBase"), {
  ssr: false,
  loading: () => <div className="h-11 w-44 bg-zinc-800 animate-pulse" />,
});

function LoginForm() {
  const { data: session, status } = useCustomSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [csrfHeader, setCsrfHeader] = useState<string | null>(null);

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
      router.replace('/dashboard')
    }
  }, [session, status, router])

  useEffect(() => {
    let cancelled = false

    async function loadCsrf() {
      try {
        const res = await fetch('/api/auth/csrf', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && data?.header) {
          setCsrfHeader(data.header)
        }
      } catch {
        if (!cancelled) {
          setCsrfHeader(null)
        }
      }
    }

    loadCsrf()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    if (!csrfHeader) {
      setLoading(false);
      setLoginError("Security token unavailable. Refresh and try again.");
      return;
    }
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfHeader,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (data?.error) {
        setLoginError(data.error);
      } else if (data?.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setLoading(false);
      setLoginError("Login failed. Please try again.");
    }
  };

  const handlePasskeySignIn = async () => {
    setPasskeyError("");

    const identifier = email.trim().toLowerCase();
    if (!identifier) {
      setPasskeyError("Enter your email first to locate a passkey.");
      return;
    }

    setPasskeyLoading(true);
    try {
      const optionsRes = await fetch('/api/passkey/auth/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const optionsPayload = await optionsRes.json();
      if (!optionsRes.ok) {
        throw new Error(optionsPayload.error || 'Unable to load passkey options.');
      }

      const credential = await Authentication.sign({
        options: optionsPayload.options,
      });

      const verifyRes = await fetch('/api/passkey/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: credential,
          challenge: optionsPayload.challenge,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Passkey verification failed.');
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setPasskeyError(
        error instanceof Error ? error.message : "Passkey sign-in failed."
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Authentication</div>
        <h1 className="text-2xl font-bold tracking-tighter uppercase">Welcome to Agentbot</h1>
        <p className="text-zinc-500 text-xs mt-2">One click to sign in</p>
      </div>

      <div className="mb-4">
        <SignInWithBase callbackUrl="/dashboard" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="w-full border border-zinc-800 text-white text-xs font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 transition-colors hover:border-zinc-600"
          onClick={() => window.location.href = '/api/auth/google'}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#4285F4"/><path d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4c-7.2 0-13.3 4.1-16.2 10.7z" fill="#34A853"/><path d="M24 44c5.1 0 9.8-1.7 13.4-4.7l-6.2-5.1C29.2 35.7 26.7 36 24 36c-6.1 0-10.7-2.8-11.7-7.5H6.3C9.2 39.9 15.3 44 24 44z" fill="#FBBC05"/></svg>
          Continue with Google
        </button>
      </div>

      <div className="mt-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
        />
      </div>

      <details className="mt-3">
        <summary className="text-zinc-500 text-xs uppercase tracking-widest cursor-pointer hover:text-white">
          Sign in with password instead
        </summary>
        <form className="mt-4 space-y-4" onSubmit={handleCredentialsLogin}>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
            <div className="mt-2">
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

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Passkey sign-in</p>
          <span className="text-[10px] text-green-300">Fast & secure</span>
        </div>
        <p className="text-zinc-400 text-xs">
          Enter your email in the field above, then tap the button below and follow the
          browser prompt to sign in with your passkey.
        </p>
        <button
          type="button"
          className="w-full border border-zinc-800 bg-white text-black text-xs font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 transition-colors hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePasskeySignIn}
          disabled={passkeyLoading}
        >
          {passkeyLoading ? "Waiting for passkey..." : "Sign in with passkey"}
        </button>
        {passkeyError && (
          <div className="text-xs text-red-400">{passkeyError}</div>
        )}
        <p className="text-[10px] text-zinc-600">
          Need to register a passkey? Sign in normally and visit your dashboard security
          settings after.
        </p>
      </div>

      {loginError && (
        <div className="mt-4 p-3 border border-red-500/30 text-red-400 text-xs">
          {loginError}
        </div>
      )}

      <p className="mt-6 text-zinc-600 text-[10px] uppercase tracking-widest">
        By continuing, you agree to Agentbot&apos;s Terms
      </p>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8">
      <h1 className="text-2xl font-bold mb-6 tracking-tighter uppercase">Log in to Agentbot</h1>
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
    <main className="min-h-screen flex items-center justify-center bg-black text-white selection:bg-blue-500/30 font-mono">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
