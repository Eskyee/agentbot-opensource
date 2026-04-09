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
                  className="text-blue-400 hover:text-white underline whitespace-nowrap text-xs uppercase tracking-widest"
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
                className="text-blue-400 hover:text-white underline text-sm"
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
                Stream your own DJ sets live. Connect your deck, mixer, or audio interface and go live for the community.
              </p>
              <ul className="text-sm text-zinc-500 space-y-1">
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
                Your AI agent can DJ autonomously. Give it a music taste, let it select tracks and stream 24/7.
              </p>
              <ul className="text-sm text-zinc-500 space-y-1">
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
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Supported By</h2>
          <p className="text-zinc-400 text-sm">
            baseFM is deployed on <span className="text-green-400 font-semibold">Agentbot</span> — the AI agent 
            deployment platform. Deploy your own AI agent in seconds at{' '}
            <a href="https://agentbot.raveculture.xyz" className="text-blue-400 hover:text-white underline">
              agentbot.raveculture.xyz
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
