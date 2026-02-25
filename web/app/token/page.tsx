export default function TokenPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">AGENTBOT Token</h1>
        
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Token Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Token Name</p>
              <p className="text-xl font-semibold">Agentbot</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Symbol</p>
              <p className="text-xl font-semibold">AGENTBOT</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Network</p>
              <p className="text-xl font-semibold">Base</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Contract Address</p>
              <div className="flex items-center gap-2">
                <code className="text-green-400 bg-gray-800 px-3 py-2 rounded font-mono text-sm break-all">
                  0x986b41C76aB8B7350079613340ee692773B34bA3
                </code>
                <a 
                  href="https://basescan.org/token/0x986b41C76aB8B7350079613340ee692773B34bA3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline whitespace-nowrap"
                >
                  View on Basescan
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Trading</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">GeckoTerminal</p>
              <a 
                href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                View AGENTBOT/WETH Pool
              </a>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">DEX</p>
              <p className="text-xl">Uniswap V4 (Base)</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">About</h2>
          <p className="text-gray-300 leading-relaxed">
            AGENTBOT is the native token of the Agentbot platform - a revolutionary AI agent deployment platform 
            that enables users to deploy AI agents in 60 seconds. The token powers the ecosystem, providing 
            access to premium features, agent deployments, and platform services.
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
