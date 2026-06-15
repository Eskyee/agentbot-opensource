import Link from 'next/link'

export const metadata = {
  title: 'Agentbot Goes Onchain: Base Builder Codes, NFT Wristbands, and Token Swaps',
  description: 'How we integrated Base ecosystem tools — Builder Codes for onchain attribution, CDP Paymaster for gasless NFT minting, and CDP Trade API for token swaps — all in one session.',
  openGraph: {
    title: 'Agentbot Goes Onchain: Builder Codes, NFT Wristbands, and Token Swaps',
    description: 'Builder Codes for attribution. NFT wristbands for community access. Token swaps via CDP. Everything we built in one night.',
  },
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        {/* Header */}
        <div className="mb-12">
          <Link href="/blog" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
            ← Blog
          </Link>
          <div className="flex flex-wrap gap-2 mt-6 mb-4">
            <span className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Base Ecosystem
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Technical Deep-Dive
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-[0.95] mt-8">
            Agentbot Goes Onchain<br />
            <span className="text-orange-500">Builder Codes, NFTs & Swaps</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-6">
            June 5, 2026 · 12 min read
          </p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <p>
            Last night we shipped three major Base ecosystem integrations in a single session:
            <strong className="text-white"> Builder Codes</strong> for onchain attribution,
            <strong className="text-white"> NFT wristbands</strong> for community access, and
            <strong className="text-white"> token swaps</strong> via the CDP Trade API.
            Here's what we built and how it works.
          </p>

          {/* BUILDER CODES */}
          <div className="border-l-2 border-orange-500 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              1. Builder Codes — Onchain Attribution
            </h2>
            <p>
              Every transaction your agent sends is anonymous without attribution. Builder Codes fix
              this by appending a unique identifier to your transaction calldata using the{' '}
              <a href="https://eips.ethereum.org/EIPS/eip-8021" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                ERC-8021 standard
              </a>.
            </p>
          </div>

          <h3 className="text-lg font-bold text-white">How It Works</h3>
          <p>
            A Builder Code is a unique string (e.g. <code className="text-orange-500">bc_4k0319ta</code>)
            that gets encoded into the last bytes of your transaction data. Smart contracts ignore the
            suffix — it's extracted by offchain indexers after the fact. Gas overhead is minimal
            (16 gas per non-zero byte).
          </p>

          <h3 className="text-lg font-bold text-white">Our Implementation</h3>
          <p>
            We integrated Builder Codes at the <strong className="text-white">wagmi config level</strong>,
            meaning every transaction from Agentbot automatically includes the attribution. Here's the setup:
          </p>

          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-xs">
            <code className="text-zinc-400">{`import { Attribution } from "ox/erc8021";

const BUILDER_CODE = 'bc_4k0319ta';

const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [coinbaseWallet({ appName: 'Agentbot' })],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  dataSuffix: DATA_SUFFIX,  // Every tx includes this
});`}</code>
          </pre>

          <p>
            The critical fix was ensuring <code className="text-orange-500">WalletProvider</code> imports
            this config instead of creating its own. Without this, the <code className="text-orange-500">dataSuffix</code> was
            dead code — transactions went out unattributed.
          </p>

          <h3 className="text-lg font-bold text-white">What You See on Base</h3>
          <p>
            Once users start sending onchain transactions (minting NFTs, swapping tokens), your
            activity appears on the Base App Leaderboard. You'll see:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-4">
            <li>Total transacting users</li>
            <li>Number of transactions</li>
            <li>Gas spent</li>
            <li>Paymaster subsidies</li>
          </ul>

          {/* NFT WRISTBAND */}
          <div className="border-l-2 border-orange-500 pl-6 mt-12">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              2. Digital Wristband — NFT Community Access
            </h2>
            <p>
              The Digital Wristband is an ERC-721 NFT on Base that grants lifetime access to
              baseFM streams, token-gated community channels, and exclusive artist drops.
            </p>
          </div>

          <h3 className="text-lg font-bold text-white">The Flow</h3>
          <p>
            Users visit <code className="text-orange-500">agentbot.sh/wristband</code> and see
            one of three states:
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">①</span>
              <div>
                <p className="text-white font-bold text-sm">Not logged in</p>
                <p className="text-zinc-500 text-xs">"Sign In with Email" + "Connect Base Wallet" buttons</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-500 text-lg">②</span>
              <div>
                <p className="text-white font-bold text-sm">Logged in, no wallet</p>
                <p className="text-zinc-500 text-xs">"Connect Base Wallet" + "Get a Base Wallet" link</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-lg">③</span>
              <div>
                <p className="text-white font-bold text-sm">Wallet connected</p>
                <p className="text-zinc-500 text-xs">Mint flow — "Mint Wristband — Free" button</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-white">Smart Wallet Detection</h3>
          <p>
            The component detects wallet connections through multiple layers:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-4">
            <li><strong className="text-zinc-300">wagmi hooks</strong> — <code className="text-orange-500">useAccount()</code> for managed connections</li>
            <li><strong className="text-zinc-300">window.ethereum</strong> — fallback detection for any EVM wallet</li>
            <li><strong className="text-zinc-300">useCustomSession</strong> — email auth state from NextAuth</li>
          </ul>

          <h3 className="text-lg font-bold text-white">CDP Paymaster (Gasless)</h3>
          <p>
            We integrated the CDP Paymaster for gasless minting. The user pays nothing — CDP
            sponsors the gas from your $500 monthly allowance. Setup requires:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 ml-4">
            <li>CDP account with payment method in Billing</li>
            <li>Paymaster endpoint URL from Onchain Tools</li>
            <li>NFT contract allowlisted in Paymaster config</li>
          </ol>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-1">⚠️ Note</p>
            <p className="text-zinc-400 text-xs">
              The example contract <code className="text-orange-500">0x66519F...D49</code> from CDP docs
              doesn't exist on Base mainnet. You need to deploy your own ERC-721 contract.
              We recommend Remix IDE for fastest deployment.
            </p>
          </div>

          {/* TOKEN SWAPS */}
          <div className="border-l-2 border-orange-500 pl-6 mt-12">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              3. Token Swaps — CDP Trade API
            </h2>
            <p>
              The CDP Trade API enables onchain token swaps across Base, Ethereum, Arbitrum,
              Optimism, and Polygon — with sub-500ms execution and multi-DEX routing.
            </p>
          </div>

          <h3 className="text-lg font-bold text-white">Supported Tokens</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { symbol: 'ETH', color: '#627EEA' },
              { symbol: 'USDC', color: '#2775CA' },
              { symbol: 'WETH', color: '#627EEA' },
              { symbol: 'DEGEN', color: '#A06CFF' },
              { symbol: 'AERO', color: '#2EB6EA' },
            ].map(t => (
              <div key={t.symbol} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold text-white" style={{ background: t.color }}>
                  {t.symbol.slice(0, 2)}
                </div>
                <span className="text-xs text-zinc-400">{t.symbol}</span>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-white">How to Swap</h3>
          <ol className="list-decimal list-inside space-y-2 text-zinc-400 ml-4">
            <li>
              <strong className="text-zinc-300">Navigate</strong> to{' '}
              <code className="text-orange-500">agentbot.sh/dashboard/swap</code>
            </li>
            <li>
              <strong className="text-zinc-300">Connect</strong> your Base wallet
            </li>
            <li>
              <strong className="text-zinc-300">Select</strong> tokens and enter amount
            </li>
            <li>
              <strong className="text-zinc-300">Review</strong> the quote (rate, price impact, slippage)
            </li>
            <li>
              <strong className="text-zinc-300">Confirm</strong> the swap in your wallet
            </li>
          </ol>

          <h3 className="text-lg font-bold text-white">API Architecture</h3>
          <p>
            The swap flow uses a two-step process:
          </p>

          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-xs">
            <code className="text-zinc-400">{`// 1. Get price estimate (debounced, fast)
POST /api/swap
{ action: "quote", fromToken, toToken, fromAmount, walletAddress }

// 2. Execute swap (requires wallet signature)
POST /api/swap
{ action: "swap", fromToken, toToken, fromAmount, walletAddress }`}</code>
          </pre>

          <p>
            The backend uses the <code className="text-orange-500">@coinbase/cdp-sdk</code> for
            quote generation and execution. Slippage protection is built in (1% default).
            Every swap includes Builder Code attribution automatically.
          </p>

          {/* BRIDGE */}
          <div className="border-l-2 border-orange-500 pl-6 mt-12">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              4. Agentbot Bridge — Chat from Any Device
            </h2>
            <p>
              The Bridge connects your local OpenClaw instance to Agentbot, letting you chat
              with your AI from any device — phone, tablet, another computer.
            </p>
          </div>

          <h3 className="text-lg font-bold text-white">Setup</h3>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-xs">
            <code className="text-orange-500">{`BRIDGE_SECRET=your_secret bash <(curl -sSL https://agentbot.sh/bridge/install.sh)`}</code>
          </pre>

          <p>
            The bridge client polls the server every 3 seconds, receives requests, runs them
            through your local OpenClaw, and sends responses back. Your data stays on your machine.
          </p>

          {/* WHAT'S NEXT */}
          <div className="border-l-2 border-orange-500 pl-6 mt-12">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              What's Next
            </h2>
          </div>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">→</span>
              <div>
                <p className="text-white font-bold text-sm">Deploy Real NFT Contract</p>
                <p className="text-zinc-500 text-xs">The CDP example contract doesn't exist on mainnet. Deploy via Remix IDE or thirdweb.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">→</span>
              <div>
                <p className="text-white font-bold text-sm">Add CDP Billing</p>
                <p className="text-zinc-500 text-xs">Enable gasless mints by adding a payment method in CDP Portal → Billing.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">→</span>
              <div>
                <p className="text-white font-bold text-sm">Base Notifications</p>
                <p className="text-zinc-500 text-xs">Push updates to users who pinned Agentbot in the Base App.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">→</span>
              <div>
                <p className="text-white font-bold text-sm">Base MCP Integration</p>
                <p className="text-zinc-500 text-xs">Give agents a wallet. Check balances, send funds, pay x402 APIs.</p>
              </div>
            </li>
          </ul>

          {/* FOOTER */}
          <div className="mt-16 pt-8 border-t border-zinc-800">
            <p className="text-zinc-600 text-xs">
              Built by Agentbot · Powered by MiMo V2.5 · Built on Base
            </p>
            <div className="flex gap-4 mt-4">
              <Link href="/dashboard/swap" className="text-orange-500 text-xs hover:underline">
                Try Swap →
              </Link>
              <Link href="/wristband" className="text-orange-500 text-xs hover:underline">
                Get Wristband →
              </Link>
              <a href="https://dashboard.base.org" target="_blank" rel="noopener noreferrer" className="text-orange-500 text-xs hover:underline">
                Base Dashboard →
              </a>
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}
