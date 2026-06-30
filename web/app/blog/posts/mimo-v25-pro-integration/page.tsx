import Link from 'next/link';

export const metadata = {
  title: 'MiMo-V2.5-Pro Integration — Agentbot',
  description:
    'Agentbot now fully supports MiMo-V2.5-Pro with OpenClaw framework, document processing, and 3x reasoning efficiency.',
};

export default function MimoIntegrationPost() {
  return (
    <main className="min-h-screen bg-black text-white">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/blog" className="text-xs text-zinc-500 hover:text-white transition-colors">
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">
              Integration
            </span>
            <span className="text-xs text-zinc-500">June 16, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">MiMo-V2.5-Pro Integration</h1>
          <p className="text-lg text-zinc-400">
            Agentbot now fully supports MiMo-V2.5-Pro with OpenClaw framework, document processing,
            and 3x reasoning efficiency.
          </p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">What Changed</h2>
            <p className="text-zinc-300 leading-relaxed">
              Xiaomi has released the official version of MiMo Claw, powered by the flagship
              MiMo-V2.5-Pro model. This release brings full compatibility with the OpenClaw
              framework, which Agentbot is built on.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">New Capabilities</h2>
            <div className="space-y-4">
              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">Ultra-Long Context</h3>
                <p className="text-sm text-zinc-400">
                  MiMo-V2.5-Pro handles complex tasks with ultra-long context and MTP architecture,
                  delivering around 3x higher reasoning efficiency than previous versions.
                </p>
              </div>
              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">Document Processing</h3>
                <p className="text-sm text-zinc-400">
                  One-stop document workflow with Kingsoft Office integration. Supports over 95% of
                  mainstream document formats including Word, Excel, PPT, and PDF with AI
                  generation, preview, and online editing.
                </p>
              </div>
              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">Token Efficiency</h3>
                <p className="text-sm text-zinc-400">
                  Excellent token efficiency with compatible TokenPlan subscriptions for reliable
                  computing power.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">What This Means for Agentbot</h2>
            <ul className="text-zinc-300 space-y-2 list-disc list-inside">
              <li>Agents can now process Word, Excel, PPT, and PDF documents natively</li>
              <li>3x better reasoning efficiency for complex tasks</li>
              <li>Full OpenClaw framework compatibility</li>
              <li>Better token efficiency = lower costs for users</li>
              <li>Free tier expanded to 4 hours daily</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Try It Now</h2>
            <p className="text-zinc-300 mb-4">
              MiMo-V2.5-Pro is available as the default model for all Agentbot agents. Existing
              users get the upgrade automatically.
            </p>
            <div className="flex gap-4">
              <Link
                href="/playground"
                className="bg-orange-500 text-black px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-orange-400 transition-colors"
              >
                Try in Playground
              </Link>
              <Link
                href="/vercel-gateway"
                className="border border-zinc-800 px-6 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
              >
                Gateway Docs
              </Link>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
