import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Liquid Wallet Kit (LWK) on Railway - Agentbot Docs',
  description: 'Set up Blockstream Liquid Wallet Kit (LWK) on Railway for multi-sig Bitcoin/Liquid operations with Jade HWW support.',
  openGraph: {
    title: 'Liquid Wallet Kit (LWK) on Railway',
    description: 'Deploy Liquid Wallet Kit on Railway for Bitcoin sidechain operations.',
    url: buildAppUrl('/docs/liquid-lwk-railway'),
  },
}

export default function LiquidLwkRailwayPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Documentation</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Liquid Wallet Kit (LWK)<br />on Railway
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Deploy Blockstream&apos;s Liquid Wallet Kit on Railway for multi-sig Bitcoin/Liquid operations with Jade HWW support.
          </p>
          <p className="text-zinc-500 max-w-2xl mx-auto mt-3 text-sm">
            If you want a full validating Liquid node instead of the lighter LWK path, use Blockstream&apos;s official Elements Core guide.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-5 mb-8">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Official Blockstream Guide</span>
          <a
            href="https://help.blockstream.com/hc/en-us/articles/900002026026-Set-up-a-Liquid-node"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Set up a Liquid node →
          </a>
          <p className="text-xs text-zinc-500 mt-3">
            Blockstream&apos;s guide covers Elements Core installation, Liquid chain sync, and the optional Bitcoin-node peg-in validation path.
          </p>
        </div>

        {/* Prerequisites */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Prerequisites</h2>
          <ul className="space-y-3 text-zinc-400">
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Railway account with a project</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Blockstream Jade hardware wallet (optional, for HWW)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Basic CLI knowledge (cargo, docker)</span>
            </li>
          </ul>
        </div>

        {/* Architecture */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Architecture</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔧</div>
              <div className="font-bold">LWK CLI</div>
              <div className="text-xs text-zinc-500 mt-1">Rust-based wallet kit</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🚂</div>
              <div className="font-bold">Railway</div>
              <div className="text-xs text-zinc-500 mt-1">Hosting & persistence</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💎</div>
              <div className="font-bold">Jade HWW</div>
              <div className="text-xs text-zinc-500 mt-1">Hardware signing</div>
            </div>
          </div>
        </div>

        {/* Installation Steps */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Setup Guide</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border border-zinc-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <h3 className="text-lg font-bold">Clone LWK Repository</h3>
              </div>
              <pre className="bg-zinc-950 rounded-lg p-4 text-sm overflow-x-auto font-mono text-zinc-300">
{`git clone https://github.com/Blockstream/lwk.git
cd lwk`}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="border border-zinc-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="text-lg font-bold">Build LWK</h3>
              </div>
              <pre className="bg-zinc-950 rounded-lg p-4 text-sm overflow-x-auto font-mono text-zinc-300">
{`cargo build --release
# Or use Docker:
docker build -t lwk .`}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="border border-zinc-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="text-lg font-bold">Set Up Signer</h3>
              </div>
              <p className="text-zinc-400 mb-4 text-sm">Choose your signing method:</p>
              <div className="space-y-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="font-bold text-sm mb-1">Software Signer</div>
                  <pre className="text-xs text-zinc-400 font-mono">
{`./lwk_cli signer create --mnemonic "your twelve words..."`}
                  </pre>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="font-bold text-sm mb-1">Jade HWW</div>
                  <pre className="text-xs text-zinc-400 font-mono">
./lwk_cli signer create --jade /dev/ttyUSB0
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border border-zinc-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <h3 className="text-lg font-bold">Create Multi-Sig Wallet</h3>
              </div>
              <pre className="bg-zinc-950 rounded-lg p-4 text-sm overflow-x-auto font-mono text-zinc-300">
{`# 2-of-2 multisig example
./lwk_cli wallet create \
  --descriptor "wsh(multi(2,key1,key2))" \
  --name my-liquid-wallet \
  --network liquid`}
              </pre>
            </div>

            {/* Step 5 */}
            <div className="border border-zinc-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                <h3 className="text-lg font-bold">Deploy to Railway</h3>
              </div>
              <pre className="bg-zinc-950 rounded-lg p-4 text-sm overflow-x-auto font-mono text-zinc-300">
{`# Option A: Docker
railway init
railway up

# Option B: Direct binary
# Add start command in Railway:
./lwk_cli server start --port $PORT`}
              </pre>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Railway Environment</h2>
          <div className="bg-zinc-800 rounded-lg p-4 font-mono text-sm">
            <div className="text-zinc-400 mb-2"># Required environment variables:</div>
            <div className="space-y-1 text-zinc-300">
              <div>LIQUID_NETWORK=liquid</div>
              <div>ELECTRUM_URL=https://liquid.electrum.blockstream.info:50002</div>
              <div>ESPLORA_URL=https://liquid.electrum.blockstream.info</div>
            </div>
          </div>
        </div>

        {/* API Usage */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Using the Wallet</h2>
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="font-bold text-sm mb-2">Get Balance</div>
              <pre className="text-xs text-zinc-400 font-mono">
./lwk_cli wallet balance --wallet my-liquid-wallet
              </pre>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="font-bold text-sm mb-2">Issue Asset</div>
                  <pre className="text-xs text-zinc-400 font-mono">
{`./lwk_cli asset issue \
  --ticker MYTOKEN \
  --name "My Token" \
  --amount 1000000 \
  --wallet my-liquid-wallet`}
                  </pre>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="font-bold text-sm mb-2">Send Transaction</div>
              <pre className="text-xs text-zinc-400 font-mono">
./lwk_cli tx create \
  --wallet my-liquid-wallet \
  --recipient lq1... \
  --satoshi 100000
              </pre>
            </div>
          </div>
        </div>

        {/* Agentbot Integration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Agentbot Integration</h2>
          <p className="text-zinc-400 mb-4">
            Connect your LWK instance to Agentbot for automated Liquid operations:
          </p>
          <ul className="space-y-3 text-zinc-400">
            <li className="flex items-start gap-3">
              <span className="text-blue-400">→</span>
              <span>Use x402 protocol for L-BTC payments</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400">→</span>
              <span>Issue security tokens for fan clubs</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400">→</span>
              <span>Automated royalty distributions via Liquid</span>
            </li>
          </ul>
          <div className="mt-4">
            <a href="/dashboard/bitcoin" className="inline-block bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
              View Bitcoin Dashboard →
            </a>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Resources</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="https://github.com/Blockstream/lwk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <span>📦</span> LWK GitHub
            </a>
            <a href="https://docs.liquid.net/docs/lwk-overview-and-examples" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <span>📖</span> LWK Documentation
            </a>
            <a href="https://help.blockstream.com/hc/en-us/articles/900002026026-Set-up-a-Liquid-node" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <span>🧱</span> Blockstream Liquid Node Guide
            </a>
            <a href="https://help.railway.xyz/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <span>🚂</span> Railway Docs
            </a>
            <a href="https://github.com/Blockstream/Jade" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <span>💎</span> Blockstream Jade
            </a>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a href="/documentation" className="text-zinc-500 hover:text-white text-sm">
            ← Back to Documentation
          </a>
        </div>
      </div>
    </main>
  )
}
