import Link from 'next/link';
import { getPublicPricing } from '../lib/stripe-pricing';

export const revalidate = 300;

export default async function SignupPage() {
  const pricing = await getPublicPricing();

  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🦞</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Launch your OpenClaw agent
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Deploy in under a minute with a 3-day trial. Pay after deployment to keep your agent live.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-lobster-500/40 bg-lobster-500/10 p-4 text-center text-sm text-gray-200">
          3-day free trial on all plans • no upfront payment required to deploy
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-2">Free Trial</h2>
            <p className="text-4xl font-bold mb-1">£0</p>
            <p className="text-gray-400 text-sm mb-4">/3 days</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li>• Full OpenClaw access</li>
              <li>• Free AI (Groq)</li>
              <li>• Telegram integration</li>
              <li>• No upfront payment</li>
            </ul>
            <Link
              href="/onboard?plan=free"
              className="block w-full text-center rounded-full bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700 transition-colors"
            >
              Start 3-day trial
            </Link>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-2">Starter</h2>
            <p className="text-4xl font-bold mb-1">{pricing.starter.formatted}</p>
            <p className="text-gray-400 text-sm mb-4">/month ({pricing.starter.currency.toUpperCase()})</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li>• Everything in Free</li>
              <li>• Bring your own AI key</li>
              <li>• Daily backups</li>
              <li>• Priority support</li>
            </ul>
            <Link
              href="/onboard?plan=starter"
              className="block w-full text-center rounded-full bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700 transition-colors"
            >
              Deploy with 3-day trial
            </Link>
            <Link href="/api/stripe/checkout?plan=starter" className="mt-3 block text-center text-sm text-gray-400 hover:text-white transition-colors">
              Pay now instead
            </Link>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border-2 border-lobster-500 relative">
            <span className="absolute -top-3 right-4 rounded-full bg-lobster-500 px-3 py-1 text-xs font-semibold">
              MOST POPULAR
            </span>
            <h2 className="text-xl font-semibold mb-2">Pro</h2>
            <p className="text-4xl font-bold mb-1">{pricing.pro.formatted}</p>
            <p className="text-gray-400 text-sm mb-4">/month ({pricing.pro.currency.toUpperCase()})</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li>• Everything in Starter</li>
              <li>• 2x resources</li>
              <li>• Custom domain</li>
              <li>• Priority support</li>
            </ul>
            <Link
              href="/onboard?plan=pro"
              className="block w-full text-center rounded-full bg-lobster-500 px-4 py-3 font-semibold text-white hover:bg-lobster-400 transition-colors"
            >
              Deploy with 3-day trial
            </Link>
            <Link href="/api/stripe/checkout?plan=pro" className="mt-3 block text-center text-sm text-gray-400 hover:text-white transition-colors">
              Pay now instead
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/50 p-6 text-center">
          <p className="text-gray-300">
            Prefer to deploy first and choose a plan later?
          </p>
          <Link
            href="/onboard"
            className="mt-4 inline-block rounded-full border border-gray-700 px-6 py-3 font-semibold hover:border-lobster-500 hover:text-lobster-300 transition-colors"
          >
            Continue to onboarding
          </Link>
        </div>
      </div>
    </main>
  );
}
