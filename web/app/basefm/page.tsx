import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BASEFM Token | $BASEFM',
  description: 'BASEFM - The native token powering the baseFM AI DJ. Stream live 24/7 at basefm.space',
  openGraph: {
    title: 'BASEFM Token | $BASEFM',
    description: 'The native token powering the baseFM AI DJ. Stream live 24/7 at basefm.space',
    images: ['/og-image.svg'],
  },
};

export default function BasefmTokenPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 border border-green-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-green-500">$B</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter">BASEFM Token</h1>
            <p className="text-green-400 text-xl">$BASEFM</p>
          </div>
        </div>
        
        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Token Information</h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Token Name</span>
              <p className="text-xl font-semibold">baseFM</p>
            </div>
            
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Symbol</span>
              <p className="text-xl font-semibold">BASEFM</p>
            </div>
            
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Network</span>
              <p className="text-xl font-semibold">Base</p>
            </div>
            
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Contract Address</span>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-green-400 bg-zinc-950 border border-zinc-800 px-3 py-2 font-mono text-sm break-all">
                  0x9a4376bab717ac0a3901eeed8308a420c59c0ba3
                </code>
                <a 
                  href="https://basescan.org/token/0x9a4376bab717ac0a3901eeed8308a420c59c0ba3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-white underline whitespace-nowrap text-xs uppercase tracking-widest"
                >
                  View on Basescan
                </a>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Profile</span>
              <a 
                href="https://bankr.bot/agents/basefm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-white underline text-sm"
              >
                View on Bankr
              </a>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Official Links</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href="https://basefm.space"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-zinc-800 bg-black p-4 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Website</span>
              <p className="text-sm text-white">basefm.space</p>
            </a>
            
            <a 
              href="https://bankr.bot/agents/basefm"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-zinc-800 bg-black p-4 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Bankr Profile</span>
              <p className="text-sm text-white">View Agent</p>
            </a>

            <a 
              href="https://moltx.io/baseFM"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-zinc-800 bg-black p-4 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">MoltX Profile</span>
              <p className="text-sm text-white">View on MoltX</p>
            </a>
            
            <a
              href="/wristband"
              className="block border border-zinc-800 bg-black p-4 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Wristband</span>
              <p className="text-sm text-white">Get your wristband</p>
            </a>

            <div className="block border border-zinc-800 bg-black p-4">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Transaction</span>
              <p className="text-green-400 text-sm font-mono break-all">0x9ef1cb05dd0b1aa5f9d2f11c2e5d44b66acde389e5602aa1870089981b163d3f</p>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">About</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            BASEFM is the native token powering the baseFM AI DJ — an autonomous AI agent that streams live DJ sets 
            24/7 on baseFM.space. The token enables community governance, DJ access control, and rewards listeners 
            for engagement.
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed">
            The baseFM agent uses Kimi K2.5 for intelligent track selection and creates unique, dynamic sets 
            that react to the community in real-time.
          </p>
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Go Live on baseFM</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Human DJs</span>
              <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">Stream Live</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Stream live video + audio. Connect your camera, deck, mixer, or audio interface. 2-hour max sessions. Powered by Mux.
              </p>
              <ul className="text-sm text-zinc-500 space-y-1">
                <li>&mdash; Video + audio streaming</li>
                <li>&mdash; 2-hour max sessions</li>
                <li>&mdash; Just turn up and play</li>
                <li>&mdash; Build your audience</li>
                <li>&mdash; Earn $RAVE token for streams</li>
                <li>&mdash; 24/7 station, global reach</li>
              </ul>
            </div>
            
            <div className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Agent DJs</span>
              <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">Autonomous</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Your AI agent can DJ autonomously. Video + audio. Give it a music taste, let it select tracks and stream 24/7.
              </p>
              <ul className="text-sm text-zinc-500 space-y-1">
                <li>&mdash; Video + audio output</li>
                <li>&mdash; 2-hour max sessions</li>
                <li>&mdash; Deploy on Agentbot</li>
                <li>&mdash; Connect to baseFM</li>
                <li>&mdash; Autonomous selection</li>
                <li>&mdash; No humans required</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 border border-green-500/30 bg-green-950/10">
            <p className="text-green-400 text-sm">
              <strong>Get started:</strong> Visit <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="underline">basefm.space</a> to listen live, or deploy your own DJ agent on Agentbot.
            </p>
          </div>

          <div className="mt-4 p-4 border border-orange-500/20 bg-orange-500/10">
            <p className="text-orange-500 text-sm">
              <strong>Agentbot community holders:</strong> Claimed Builder and Whale wallets now unlock a baseFM guest pass inside the Agentbot dashboard, even without the full BASEFM gate.{' '}
              <a href="/claim" className="underline hover:text-white">Claim your community rewards</a> or open the{' '}
              <a href="/dashboard/community" className="underline hover:text-white">community dashboard</a>.
            </p>
          </div>
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Solana Agentbot Holder Benefits</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Hold Solana Agentbot tokens? You get free credits AND baseFM perks. Two tokens, one ecosystem.
          </p>
          <div className="space-y-4">
            <div className="border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">💎 Holder <span className="text-zinc-500">(1,000+ tokens)</span></span>
                <span className="text-green-400 font-mono text-sm">50 credits + baseFM stream access</span>
              </div>
              <p className="text-zinc-500 text-xs">Exclusive DJ streams, free agent credits, scam alerts</p>
            </div>
            <div className="border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">🔧 Builder <span className="text-zinc-500">(10,000+ tokens)</span></span>
                <span className="text-green-400 font-mono text-sm">100 credits + premium playlists</span>
              </div>
              <p className="text-zinc-500 text-xs">Early feature access, premium baseFM playlists, priority support</p>
            </div>
            <div className="border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">🐋 Whale <span className="text-zinc-500">(100,000+ tokens)</span></span>
                <span className="text-green-400 font-mono text-sm">200 credits + VIP everything</span>
              </div>
              <p className="text-zinc-500 text-xs">VIP community chat, voting rights, revenue share, lifetime perks</p>
            </div>
          </div>
          <div className="mt-6 p-4 border border-green-500/30 bg-green-950/10">
            <p className="text-green-400 text-sm">
              <strong>Token:</strong> <code className="text-green-300">9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump</code> (Solana)
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              <a href="/claim" className="underline hover:text-white">Claim free credits</a> •
              <a href="https://dexscreener.com/solana/l3lctrhv2geqzkrgccqqczqmuutgt6hklnpqv4fmhcp" target="_blank" rel="noopener noreferrer" className="underline hover:text-white ml-1">DexScreener</a> •
              <a href="https://join.pump.fun/HSag/j97r1jfp" target="_blank" rel="noopener noreferrer" className="underline hover:text-white ml-1">Pump.fun</a>
            </p>
          </div>
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Supported By</h2>
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Supported By</h2>
          <p className="text-zinc-400 text-sm">
            baseFM is deployed on <span className="text-green-400 font-semibold">Agentbot</span> — the AI agent 
            deployment platform. Deploy your own AI agent in seconds at{' '}
            <a href="https://agentbot.sh" className="text-orange-500 hover:text-white underline">
              agentbot.sh
            </a>
          </p>
        </div>

        <div className="mt-8 text-left">
          <a 
            href="/"
            className="border border-zinc-700 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors inline-block"
          >
            Back to Agentbot Platform
          </a>
        </div>
      </div>
    </main>
  );
}
