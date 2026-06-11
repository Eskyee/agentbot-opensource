import Link from 'next/link'

export const metadata = {
  title: 'v1.2.0 — Base Integration, MCP, and the Crash That Taught Us Everything',
  description: 'Agentbot v1.2.0 ships Base ecosystem integration, Model Context Protocol, NFT wristbands, token swaps, and AskAtlas. Plus the production crash that forced us to rethink provider boundaries.',
  openGraph: {
    title: 'v1.2.0 — Base Integration, MCP, and the Crash That Taught Us Everything',
    description: 'Builder Codes, NFT wristbands, token swaps, MCP server, and a production crash that made us better. This is what shipping looks like.',
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
              Release Notes
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Base Ecosystem
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Lessons Learned
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-[0.95] mt-8">
            v1.2.0 — Base Integration,<br />
            <span className="text-orange-500">MCP & Crash Fixes</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-6">
            June 5, 2026 · 10 min read
          </p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

          {/* INTRO */}
          <p>
            We shipped v1.2.0 at 3AM on a Friday. Not because we had to. Because the code was ready and the coffee was strong and there's a specific kind of clarity that only shows up when the rest of the world is asleep.
          </p>
          <p>
            This release is big. Base ecosystem integration. Model Context Protocol. NFT wristbands. Token swaps. A MiMo-powered support chatbot. And a production crash that taught us more about React internals than any documentation ever could.
          </p>
          <p>
            Here's what happened.
          </p>

          {/* THE CRASH */}
          <div className="border-l-2 border-red-500 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              The Crash That Started Everything
            </h2>
            <p>
              We deployed a clean build. TypeScript passed. Tests passed. Vercel said "Ready." We clicked through the dashboard and everything looked fine.
            </p>
            <p className="mt-3">
              Then we hit a non-dashboard page. Black screen. "SOMETHING WENT WRONG." No console errors. No stack trace. Just... nothing.
            </p>
            <p className="mt-3">
              Turns out we'd put a wagmi hook in the root layout. <code className="text-orange-400 text-xs">useAccount()</code> needs a <code className="text-orange-400 text-xs">WalletProvider</code> above it in the component tree. The root layout renders on every route. The WalletProvider only wrapped dashboard routes. So every non-dashboard page crashed silently.
            </p>
            <p className="mt-3">
              Then we found the second one. We'd removed the RadioWidget import but left the <code className="text-orange-400 text-xs">{'<RadioWidget />'}</code> JSX in the page. The component was undefined but Next.js didn't throw — it just... didn't render. Silent failure. The worst kind.
            </p>
            <p className="mt-3 font-bold text-white">
              Two lessons. Two rules we now enforce mechanically:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>Never put wagmi-dependent components in root layout</li>
              <li>Always search for both import AND usage when removing a component — <code className="text-orange-400 text-xs">grep -r ComponentName</code> before committing</li>
            </ul>
          </div>

          {/* BASE INTEGRATION */}
          <div className="border-l-2 border-orange-500 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              Base Ecosystem Integration
            </h2>
            <p>
              This was the big one. We didn't just add Base as a chain — we integrated the entire ecosystem.
            </p>
          </div>

          <h3 className="text-lg font-bold text-white uppercase tracking-tight">
            Builder Codes
          </h3>
          <p>
            Every wallet transaction now includes builder code <code className="text-orange-400 text-xs">bc_4k0319ta</code>. This means when users check their Base dashboard, they see Agentbot attribution — every swap, every mint, every transaction traces back to us. It's onchain proof that we're building real utility, not just shipping tokens.
          </p>
          <p>
            The implementation was deceptively simple: intercept transaction params, inject the builder code, pass through. But getting it right meant understanding how Base reads builder codes from calldata, how the dashboard renders attribution, and what happens when the code is malformed.
          </p>

          <h3 className="text-lg font-bold text-white uppercase tracking-tight">
            NFT Wristbands
          </h3>
          <p>
            ERC-721 contracts for community wristbands. Mint, gasless mint (via CDP Paymaster), total minted, remaining supply — all exposed as React hooks. The wristband isn't just a collectible — it's an access token. Hold one, get into exclusive channels, events, and drops.
          </p>
          <p>
            We built the contract hooks first, then the UI. The hooks are reusable — any project can drop in <code className="text-orange-400 text-xs">useNFTWristband()</code> and get mint functionality in minutes.
          </p>

          <h3 className="text-lg font-bold text-white uppercase tracking-tight">
            Token Swaps
          </h3>
          <p>
            CDP Trade API integration for ETH, USDC, WETH, DEGEN, and AERO on Base. Users can swap directly from their agentbot dashboard. No bridging to Uniswap. No leaving the platform. The agent handles the swap, the user gets the tokens.
          </p>
          <p>
            This matters because agents need to move value. Pay for services. Split revenue. Buy NFTs. Token swaps are the financial plumbing that makes autonomous agents actually autonomous.
          </p>

          <h3 className="text-lg font-bold text-white uppercase tracking-tight">
            Sign in with Base
          </h3>
          <p>
            Wallet authentication via <code className="text-orange-400 text-xs">@base-org/account</code>. No more Google-only auth. Users connect their Base wallet, sign a message, and they're in. Their wallet address becomes their identity. Their onchain history becomes their reputation.
          </p>
          <p>
            And here's the kicker: <strong className="text-white">Base wallet users get 5 free AI messages per day.</strong> No signup. No credit card. Just connect your wallet and start talking to Atlas. It's the lowest-friction onboarding we've ever built.
          </p>

          {/* MCP */}
          <div className="border-l-2 border-blue-500 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              Model Context Protocol
            </h2>
            <p>
              MCP is the standard for how AI assistants connect to external tools. We built an MCP server that exposes Agentbot's capabilities — agent management, channel configuration, credit balance, deployment status — as tools that any MCP-compatible client can use.
            </p>
            <p>
              What this means in practice: Claude Desktop, Cursor, or any MCP-enabled assistant can discover Agentbot's tools, call them, and get results. Your AI assistant can check your agent status, top up credits, or restart a channel — without leaving the IDE.
            </p>
            <p>
              We published the setup guide in the docs. 900+ lines of integration documentation. Because if we're going to build on open standards, we should make it easy for everyone else to do the same.
            </p>
          </div>

          {/* ASK ATLAS */}
          <div className="border-l-2 border-green-500 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              AskAtlas
            </h2>
            <p>
              A MiMo-powered support chatbot that lives in the bottom-right corner of every page. Ask it about pricing, setup, troubleshooting — it knows the docs, the pricing tiers, the common issues. Powered by MiMo V2.5 Pro. Gated behind Google sign-in so we don't burn credits on bots.
            </p>
            <p>
              The interesting part isn't the chatbot itself — it's the architecture. <code className="text-orange-400 text-xs">useChat()</code> from the Vercel AI SDK needs an <code className="text-orange-400 text-xs">{'<AI>'}</code> provider context. We didn't have one. The component crashed silently on render — another invisible failure. Adding the provider, fixing the message format mismatch between AI SDK v5 and v6, and wiring up the transport layer was a masterclass in reading docs before guessing.
            </p>
          </div>

          {/* BANKR */}
          <div className="border-l-2 border-orange-500 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              Bankr Ecosystem
            </h2>
            <p>
              Onchain portfolio data, DeFi positions, and token analytics — all exposed through Bankr's API. Users can see their full crypto portfolio inside Agentbot. Not just balances — yield positions, liquidity pools, governance votes. The full picture.
            </p>
            <p>
              This is part of a bigger vision: agents that understand your financial position and can act on it. Not just chat about your portfolio — manage it.
            </p>
          </div>

          {/* WHAT WE LEARNED */}
          <div className="border-l-2 border-yellow-500 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              What We Actually Learned
            </h2>
            <p>
              28 commits between v1.1.0 and v1.2.0. Here's what stuck:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-zinc-400">
              <li><strong className="text-white">React provider boundaries are invisible walls.</strong> wagmi hooks in root layout = every non-dashboard page crashes. Move wallet components to route scope, or move WalletProvider to root. Pick one.</li>
              <li><strong className="text-white">useChat() requires an AI provider.</strong> This is documented. We didn't read the docs. We paid for it in debug time.</li>
              <li><strong className="text-white">Dangling JSX = silent crash.</strong> Remove the import AND the usage. Always grep.</li>
              <li><strong className="text-white">TypeScript compiles ≠ works in production.</strong> Every feature needs a curl test, a click-through test, a happy-path verification. "It builds" is necessary, not sufficient.</li>
              <li><strong className="text-white">Shipping without verification is delusion.</strong> 19 commits in a day means nothing if none of them were tested end-to-end.</li>
            </ul>
          </div>

          {/* NUMBERS */}
          <div className="grid grid-cols-3 gap-4 my-8">
            <div className="text-center p-4 border border-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">28</div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Commits</div>
            </div>
            <div className="text-center p-4 border border-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">6</div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Features</div>
            </div>
            <div className="text-center p-4 border border-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">900+</div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Doc Lines</div>
            </div>
          </div>

          {/* WHAT'S NEXT */}
          <div className="border-l-2 border-zinc-700 pl-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">
              What's Next
            </h2>
            <p>
              v1.2.0 is the foundation. Base integration is live, MCP is live, the crash bugs are fixed. But this is a platform — it's never done.
            </p>
            <p className="mt-3">
              Next up: AskAtlas refinements (the retry logic needs work), deeper Bankr integration, and getting the NFT wristband mint live on mainnet. Plus whatever breaks at 3AM that we didn't anticipate.
            </p>
            <p className="mt-3">
              If you want to build on this — the repo is open. Fork it. Break it. Send us a PR.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 border border-orange-500/30 rounded-lg bg-orange-500/5">
            <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-3">
              Get Started
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://agentbot.sh/signup"
                className="px-4 py-2 bg-orange-500 text-black text-xs font-bold uppercase tracking-widest hover:bg-orange-400 transition-colors"
              >
                Deploy an Agent
              </a>
              <a
                href="https://github.com/Eskyee/agentbot-opensource"
                className="px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
              >
                View on GitHub
              </a>
              <a
                href="https://agentbot.sh/documentation"
                className="px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
              >
                Read the Docs
              </a>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-16 pt-8 border-t border-zinc-900">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
              Published by Agentbot · Built on OpenClaw · Powered by MiMo V2.5 Pro
            </p>
            <p className="text-[10px] text-zinc-800 mt-2">
              <a href="https://agentbot.sh" className="hover:text-zinc-500 transition-colors">agentbot.sh</a>
              {' · '}
              <a href="https://github.com/Eskyee/agentbot-opensource" className="hover:text-zinc-500 transition-colors">GitHub</a>
              {' · '}
              <a href="https://x.com/Esky33junglist" className="hover:text-zinc-500 transition-colors">@Esky33junglist</a>
            </p>
          </div>

        </div>
      </article>
    </main>
  )
}
