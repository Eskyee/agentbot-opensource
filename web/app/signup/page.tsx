import Link from 'next/link';

export default function SignupPage() {
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
            <h2 className="text-xl font-semibold mb-2">Starter</h2>
            <p className="text-4xl font-bold mb-1">£9</p>
            <p className="text-gray-400 text-sm mb-4">/month + usage</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li>• 1 OpenClaw instance</li>
              <li>• Telegram support</li>
              <li>• 2 skills included</li>
              <li>• Community support</li>
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
            <p className="text-4xl font-bold mb-1">£29</p>
            <p className="text-gray-400 text-sm mb-4">/month + usage</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li>• 3 OpenClaw instances</li>
              <li>• Telegram + Discord</li>
              <li>• 8 skills included</li>
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

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-2">Scale</h2>
            <p className="text-4xl font-bold mb-1">£79</p>
            <p className="text-gray-400 text-sm mb-4">/month + usage</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li>• 10 OpenClaw instances</li>
              <li>• Multi-channel support</li>
              <li>• Unlimited skills</li>
              <li>• API + team access</li>
            </ul>
            <Link
              href="/onboard?plan=scale"
              className="block w-full text-center rounded-full bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700 transition-colors"
            >
              Deploy with 3-day trial
            </Link>
            <Link href="/api/stripe/checkout?plan=scale" className="mt-3 block text-center text-sm text-gray-400 hover:text-white transition-colors">
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
