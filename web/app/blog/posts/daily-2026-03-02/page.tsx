import Link from 'next/link';

export default function Post() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">2 March 2026</p>
            <h1 className="text-4xl font-bold mb-4">Agentbot Upgraded to OpenClaw v2026.3.1</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Update</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">OpenClaw</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-800 text-blue-400">Major Release</span>
            </div>
          </div>

          <p className="text-gray-300 mb-4">We're excited to announce that Agentbot has been upgraded to the latest OpenClaw release - <strong>v2026.3.1</strong>! This major update brings significant improvements in stability, performance, and new features.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What's New in OpenClaw v2026.3.1</h2>
          
          <p className="text-gray-300 mb-4">This release includes numerous enhancements:</p>
          <li className="text-gray-300 mb-2"><strong>Gateway Stability Improvements</strong> - Better connection handling and faster recovery from disconnects</li>
          <li className="text-gray-300 mb-2"><strong>Voice Mode Enhancements</strong> - Improved voice wake and talk mode with better audio quality</li>
          <li className="text-gray-300 mb-2"><strong>Model Support</strong> - Added support for the latest AI models including Gemini 3 family</li>
          <li className="text-gray-300 mb-2"><strong>Configuration Fixes</strong> - Resolved issues with auth profiles and shell environment variables</li>
          <li className="text-gray-300 mb-2"><strong>macOS Improvements</strong> - Better LaunchAgent handling for auto-start on boot</li>

          <h2 className="text-2xl font-bold mt-8 mb-4">What This Means for Agentbot Users</h2>
          
          <p className="text-gray-300 mb-4">With this upgrade, users can expect:</p>
          <li className="text-gray-300 mb-2">More reliable gateway connections that stay connected longer</li>
          <li className="text-gray-300 mb-2">Faster agent response times</li>
          <li className="text-gray-300 mb-2">Better local deployment experience on macOS</li>
          <li className="text-gray-300 mb-2">Access to the latest AI models</li>

          <h2 className="text-2xl font-bold mt-8 mb-4">How to Update</h2>
          
          <p className="text-gray-300 mb-4">If you're running a local OpenClaw instance, update with:</p>
          <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 mb-4 overflow-x-auto">
            <code>openclaw update</code>
          </pre>

          <p className="text-gray-300 mb-4">Agentbot cloud users will receive the update automatically with their next deployment.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Full Changelog</h2>
          
          <p className="text-gray-300 mb-4">For the complete list of changes, bug fixes, and new features, check out the <a href="https://github.com/openclaw/openclaw/releases/tag/v2026.3.1" className="text-blue-400 hover:underline">official release notes on GitHub</a>.</p>

          <p className="text-gray-300 mb-4">Stay tuned for more updates as we continue to improve Agentbot!</p>
        </article>
      </div>
    </main>
  );
}
