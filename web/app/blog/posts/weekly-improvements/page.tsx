import Link from 'next/link';

export default function WeeklyImprovementsPost() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">February 2026</p>
            <h1 className="text-4xl font-bold mb-4">Weekly Improvements: What is Shipping</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Update</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Weekly</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-6">
            This week's improvements: dark mode UI, Stripe checkout, OAuth, and email integration.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Dark Mode UI Refresh</h2>
          <p className="text-gray-300 mb-4">
            Complete redesign with Geist Design System. Cleaner typography, better contrast, and refined shadows throughout.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Stripe Checkout Flow</h2>
          <p className="text-gray-300 mb-4">
            Seamless payment integration for credit purchases. Buy credits with card, Apple Pay, or Google Pay.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">OAuth with Google & GitHub</h2>
          <p className="text-gray-300 mb-4">
            Sign up in one click. No password required. Secure authentication via NextAuth.js.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Resend Email Integration</h2>
          <p className="text-gray-300 mb-4">
            Welcome emails, password resets, and deployment notifications now sent via Resend.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Bug Fixes</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Fixed white text on white buttons</li>
            <li>Improved mobile navigation</li>
            <li>Better error messages</li>
            <li>Faster dashboard loading</li>
          </ul>

          <div className="mt-12 p-6 rounded-xl bg-gray-900 border border-gray-800">
            <p className="text-gray-300 mb-4">Try the new experience</p>
            <Link href="/signup" className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
