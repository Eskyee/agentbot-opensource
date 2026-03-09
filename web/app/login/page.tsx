"use client";
import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import SignInWithBase from "@/app/components/SignInWithBase";

function LoginForm() {
  const { data: session, status } = useSession()
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

  const handleGoogleLogin = () => {
    setLoading(true)
    signIn("google", { callbackUrl: "/dashboard" })
  }

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
      setLoginError("Invalid email or password.");
    } else if (res?.ok) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🦞</div>
        <h1 className="text-2xl font-bold">Welcome to Agentbot</h1>
        <p className="text-gray-400 text-sm mt-1">One click to sign in</p>
      </div>

      {/* Sign in with Base — PRIMARY */}
      <div className="mb-4 flex justify-center">
        <SignInWithBase onError={(msg) => setLoginError(msg)} />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-900 text-gray-500">or</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#4285F4"/><path d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.7 0 5.2.9 7.2 2.5l6.4-6.4C34.2 6.2 29.4 4 24 4c-7.2 0-13.3 4.1-16.2 10.7z" fill="#34A853"/><path d="M24 44c5.1 0 9.8-1.7 13.4-4.7l-6.2-5.1C29.2 35.7 26.7 36 24 36c-6.1 0-10.7-2.8-11.7-7.5H6.3C9.2 39.9 15.3 44 24 44z" fill="#FBBC05"/></svg>
          Continue with Google
        </button>
      </div>

      {/* Email/Password - collapsible */}
      <details className="mt-6">
        <summary className="text-center text-gray-500 text-sm cursor-pointer hover:text-white">
          Sign in with email instead
        </summary>
        <form className="mt-4 space-y-4" onSubmit={handleCredentialsLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-green-500 hover:bg-green-400 py-3 font-bold text-black"
            disabled={loading}
          >
            Continue
          </button>
        </form>
      </details>

      {loginError && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
          {loginError}
        </div>
      )}

      <p className="mt-6 text-center text-gray-500 text-xs">
        By continuing, you agree to Agentbot's Terms
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
