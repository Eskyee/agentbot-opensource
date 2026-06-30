'use client';

import Link from 'next/link';

export default function BaseIntegrationSprint() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/blog"
            className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
          >
            ← Back to Blog
          </Link>
          <div className="mt-6">
            <span className="text-[10px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-2 py-1 rounded">
              Shipping
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase mt-4">
            Base Integration Sprint
          </h1>
          <p className="text-lg text-zinc-400 mt-2">
            Free AI, NFT Wristbands, Token Swaps — all on Base
          </p>
          <p className="text-xs text-zinc-600 mt-3">
            June 5, 2026 · 52 files · 4,318 lines · 32 commits
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">48h</div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-600">Sprint Time</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">32</div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-600">Commits</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">+4,318</div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-600">Lines Added</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">0</div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-600">TS Errors</div>
          </div>
        </div>

        {/* What We Built */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tighter uppercase mb-6">What We Built</h2>

          <div className="space-y-6">
            <div className="border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500 text-sm">✅</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Free Daily AI Messages
                </h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Connect your Base wallet → get 5 free AI messages per day. No signup. No credit
                card. Just connect and go. This is the growth engine — the single feature that takes
                us from 3 users to 300.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Prisma schema
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  API endpoint
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Badge component
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  useFreeTier hook
                </span>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500 text-sm">✅</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  NFT Wristband Contract
                </h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Full ERC-721 Solidity contract with gasless minting via CDP Paymaster, batch minting
                for airdrops, and 10,000 max supply. OpenZeppelin base, reentrancy guard, events.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Solidity 0.8.34
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  OpenZeppelin
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  wagmi hooks
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Remix deploy guide
                </span>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500 text-sm">✅</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">Token Swaps on Base</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Swap ETH, USDC, WETH, DEGEN, and AERO directly in the dashboard. Powered by CDP
                Trade API for sub-500ms execution and multi-DEX routing.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  CDP Trade API
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Quote-first pattern
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Slippage control
                </span>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500 text-sm">✅</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Builder Code Attribution
                </h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every onchain transaction includes our builder code{' '}
                <code className="text-orange-500">bc_4k0319ta</code> via ERC-8021. Base can see our
                transaction volume. Attribution is automatic — no per-tx opt-in needed.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  ERC-8021
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  ox/erc8021
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  dataSuffix
                </span>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500 text-sm">✅</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">Radio Widget</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                baseFM radio player embedded in the dashboard. Built in the Playground, deployed as
                an iframe widget. Collapsible, with LIVE badge and &quot;Built in Playground&quot;
                footer.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  iframe embed
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Dynamic import
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Sandboxed
                </span>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-500 text-sm">✅</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">Base MCP Integration</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Model Context Protocol server connecting AI agents to Base Account smart wallets.
                Check balances, swap tokens, sign messages — all via natural language.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  MCP server
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  Non-custodial
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
                  User sign-off
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sign in with Base */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tighter uppercase mb-6">Sign in with Base</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            All wallet sign-in flows now use &quot;Sign in with Base&quot; via the{' '}
            <code className="text-orange-500">@base-org/account</code> SDK. Better UX, QR code
            scanning, works with any Base-compatible wallet.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-white">Dashboard</div>
              <div className="text-[9px] text-zinc-600">Sign in with Base</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-white">DJ Stream</div>
              <div className="text-[9px] text-zinc-600">Sign in with Base</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-white">Wristband</div>
              <div className="text-[9px] text-zinc-600">Sign in with Base</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-white">Login</div>
              <div className="text-[9px] text-zinc-600">Sign in with Base</div>
            </div>
          </div>
        </section>

        {/* Try It */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tighter uppercase mb-6">Try It Now</h2>
          <div className="space-y-3">
            <a
              href="https://agentbot.sh/login"
              className="block bg-orange-500 hover:bg-orange-400 text-black px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors text-center"
            >
              Free — Connect Base Wallet →
            </a>
            <a
              href="https://agentbot.sh/dashboard/swap"
              className="block border border-zinc-800 hover:border-zinc-600 text-white px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors text-center"
            >
              Swap Tokens →
            </a>
            <a
              href="https://agentbot.sh/wristband"
              className="block border border-zinc-800 hover:border-zinc-600 text-white px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors text-center"
            >
              Mint Wristband →
            </a>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-zinc-900 pt-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">
            Built with ❤️ by Agentbot · RaveCulture · June 2026
          </p>
        </div>
      </div>
    </main>
  );
}
