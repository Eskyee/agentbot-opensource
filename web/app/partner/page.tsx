import Link from 'next/link';

export const metadata = {
  title: 'Partner With Us | Agentbot',
  description: 'Want to partner with Agentbot? Tell us what value you could bring and how we could work together.',
};

export default function PartnerPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Partner With Us
        </h1>
        <p className="text-xl text-gray-400 mb-10">
          Build together. Win together.
        </p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What We're Looking For</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>AI Model Providers</strong> - Want your model on our platform?</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Tool & API Integrations</strong> - Connect your service to our agents</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Resellers & Agencies</strong> - Offer Agentbot to your clients</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Content Creators</strong> - Tutorials, guides, demos</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Developer Advocates</strong> - Build open-source agent templates</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Infrastructure Partners</strong> - Discord/Telegram/Social platforms</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What We Bring</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Live Traffic</strong> - Our agents serve real users 24/7</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Distribution</strong> - Access to our user base</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Revenue Share</strong> - Partner pricing on Agentbot plans</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>API Access</strong> - Programmatic access to our platform</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Co-marketing</strong> - Blog posts, demos, case studies</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Direct Access</strong> - Work directly with the builders</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-green-500/30 p-6">
          <h2 className="text-xl font-semibold mb-4">Get In Touch</h2>
          <p className="text-gray-400 mb-4">
            Tell us who you are, what you're building, and what value you could bring.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Email us directly:</p>
            <a 
              href="mailto:partners@agentbot.raveculture.xyz" 
              className="text-xl text-green-400 hover:underline font-bold"
            >
              partners@agentbot.raveculture.xyz
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← Back to Agentbot
          </Link>
        </div>
      </div>
    </main>
  );
}