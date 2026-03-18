import Link from 'next/link';

export const metadata = {
  title: 'Battle Tested: Living in the Field | Agentbot',
  description: 'How we built Agentbot from the trenches - real problems, real solutions, zero marketing fluff.',
};

export default function BattleTestedPost() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-green-400 tracking-widest">LIVE FROM THE FIELD</span>
            <span className="text-xs text-gray-500">14 March 2026</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Battle Tested: How We Built Agentbot in the Trenches
          </h1>
          <p className="text-xl text-gray-400">
            No VC pitch decks. No marketing fluff. Just builders building.
          </p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <p>
            We didn't build Agentbot in a nice office. We built it <strong>living in the field</strong> - 
            deployed on servers, running in production, breaking in real-time.
          </p>

          <h2>The Problem</h2>
          <p>
            Every "AI agent platform" we tried was the same: beautiful landing pages, 
            broken deployments, and support tickets that never got answered. 
            They were built to <em>look</em> like they worked. Not actually work.
          </p>

          <h2>Our Approach</h2>
          <p>
            We deployed our own agents. Every single day. We ran baseFM 24/7 - 
            real users, real money, real problems. When something broke, 
            <strong>we felt it immediately</strong>.
          </p>

          <ul>
            <li><strong>60-second deployments</strong> - not because it sounds good, but because we were tired of waiting</li>
            <li><strong>OpenClaw</strong> - we needed something that actually worked, not a wrapper around a wrapper</li>
            <li><strong>Kimi K2.5</strong> - the best model we found after testing dozens</li>
            <li><strong>No credit system</strong> - users bring their own keys, we don't hold your money</li>
          </ul>

          <h2>What We Learned</h2>
          <p>
            The hard way:
          </p>
          <ul>
            <li>Docker doesn't care about your feelings</li>
            <li>AI APIs go down at 3am</li>
            <li>Telegram has rate limits (who knew?)</li>
            <li>Users will find bugs you never imagined</li>
            <li>Security isn't optional</li>
          </ul>

          <h2>What's Different</h2>
          <p>
            Agentbot runs <Link href="/dashboard" className="text-green-400 hover:underline">in production right now</Link>. 
            Our own agents use it daily. When you deploy, you're using the same infrastructure we trust with our own projects.
          </p>
          <p>
            No sales team. No demo environments that don't match production. 
            Just the real thing.
          </p>

          <h2>What's Coming</h2>
          <p>
            We're just getting started. The platform now handles:
          </p>
          <ul>
            <li>Multi-channel deployment (Telegram, etc)</li>
            <li>Bankr crypto trading integration</li>
            <li>x402 USDC payments</li>
            <li>Agent swarms and workflows</li>
            <li>Scheduled tasks</li>
          </ul>
          <p>
            And we're adding more <Link href="https://raveculture.mintlify.app" className="text-green-400 hover:underline">every day</Link>.
          </p>

          <h2>Join Us</h2>
          <p>
            If you're a builder who wants an agent platform that actually works - 
            not one built for pitch decks - try Agentbot.
          </p>
          <p>
            <Link href="/signup" className="text-green-400 font-bold hover:underline">
              Get started →
            </Link>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link href="/blog" className="text-gray-400 hover:text-white">
            ← Back to Blog
          </Link>
        </div>
      </article>
    </main>
  );
}