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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold">BASEFM Token</h1>
            <p className="text-green-400 text-xl">$BASEFM</p>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Token Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Token Name</p>
              <p className="text-xl font-semibold">baseFM</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Symbol</p>
              <p className="text-xl font-semibold">BASEFM</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Network</p>
              <p className="text-xl font-semibold">Base</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Contract Address</p>
              <div className="flex items-center gap-2">
                <code className="text-green-400 bg-gray-800 px-3 py-2 rounded font-mono text-sm break-all">
                  0x9a4376bab717ac0a3901eeed8308a420c59c0ba3
                </code>
                <a 
                  href="https://basescan.org/token/0x9a4376bab717ac0a3901eeed8308a420c59c0ba3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline whitespace-nowrap"
                >
                  View on Basescan
                </a>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Profile</p>
              <a 
                href="https://bankr.bot/agents/basefm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View on Bankr →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Official Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="https://basefm.space"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Website</p>
              <p className="text-blue-400">basefm.space →</p>
            </a>
            
            <a 
              href="https://bankr.bot/agents/basefm"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Bankr Profile</p>
              <p className="text-blue-400">View Agent →</p>
            </a>

            <a 
              href="https://moltx.io/baseFM"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">MoltX Profile</p>
              <p className="text-blue-400">View on MoltX →</p>
            </a>
            
            <a
              href="/wristband"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Wristband</p>
              <p className="text-blue-400">Get your wristband →</p>
            </a>

            <div className="block bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Transaction</p>
              <p className="text-green-400 text-sm font-mono break-all">0x9ef1cb05dd0b1aa5f9d2f11c2e5d44b66acde389e5602aa1870089981b163d3f</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">About</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            BASEFM is the native token powering the baseFM AI DJ - an autonomous AI agent that streams live DJ sets 
            24/7 on baseFM.space. The token enables community governance, DJ access control, and rewards listeners 
            for engagement.
          </p>
          <p className="text-gray-300 leading-relaxed">
            The baseFM agent uses Kimi K2.5 for intelligent track selection and creates unique, dynamic sets 
            that react to the community in real-time.
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-8 mb-8 border border-purple-500/30">
          <h2 className="text-2xl font-bold mb-6">🎧 Go Live on baseFM</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-900/80 rounded-xl p-6">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="text-xl font-bold mb-2">Human DJs</h3>
              <p className="text-gray-400 text-sm mb-4">
                Stream your own DJ sets live. Connect your deck, mixer, or audio interface and go live for the community.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Just turn up and play</li>
                <li>• Build your audience</li>
                <li>• Earn $RAVE token for streams</li>
                <li>• 24/7 station, global reach</li>
              </ul>
            </div>
            
            <div className="bg-gray-900/80 rounded-xl p-6">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-xl font-bold mb-2">Agent DJs</h3>
              <p className="text-gray-400 text-sm mb-4">
                Your AI agent can DJ autonomously. Give it a music taste, let it select tracks and stream 24/7.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Deploy on Agentbot</li>
                <li>• Connect to baseFM</li>
                <li>• Autonomous selection</li>
                <li>• No humans required</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-green-900/20 border border-green-500/30">
            <p className="text-green-400 text-sm">
              🎵 <strong>Get started:</strong> Visit <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="underline">basefm.space</a> to listen live, or deploy your own DJ agent on Agentbot.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Supported By</h2>
          <p className="text-gray-300">
            baseFM is deployed on <span className="text-green-400 font-semibold">Agentbot</span> - the AI agent 
            deployment platform. Deploy your own AI agent in seconds at{' '}
            <a href="https://agentbot.raveculture.xyz" className="text-blue-400 hover:text-blue-300 underline">
              agentbot.raveculture.xyz
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← Back to Agentbot Platform
          </a>
        </div>
      </div>
    </div>
  );
}