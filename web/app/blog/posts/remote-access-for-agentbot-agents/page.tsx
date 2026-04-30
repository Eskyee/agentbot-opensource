import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Remote Access for Agentbot Agents - SSH, Tailscale Serve, Funnel, and Tailnet',
  description:
    'Learn how to choose and set up remote access for Agentbot agents using SSH tunnels, Tailscale Serve, Tailscale Funnel, or direct Tailnet binding.',
}

const sshCommand = 'ssh -N -L 18789:127.0.0.1:18789 user@host'

export default function RemoteAccessForAgentbotAgentsPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest">
          Back to Blog
        </Link>

        <header className="mt-10 mb-12">
          <div className="text-[10px] uppercase tracking-widest text-orange-400 mb-4">Guide</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            Remote Access for Agentbot Agents
          </h1>
          <div className="flex items-center gap-4 text-zinc-500 text-xs">
            <span>April 30, 2026</span>
            <span>-</span>
            <span>6 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-xl text-zinc-300 leading-relaxed mb-8">
            Agentbot now lets users choose how they want to reach their OpenClaw Gateway remotely. The default is still no
            extra remote access. If you need it, pick SSH, Tailscale Serve, Tailscale Funnel, or a direct Tailnet bind.
          </p>

          <div className="border border-zinc-800 bg-zinc-950 p-6 my-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400 mb-4">Fast Choice</h2>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li><strong className="text-white">SSH:</strong> safest universal fallback. Nothing public is exposed.</li>
              <li><strong className="text-white">Tailscale Serve:</strong> best tailnet UX. HTTPS on your tailnet, Gateway stays loopback-only.</li>
              <li><strong className="text-white">Tailscale Funnel:</strong> public HTTPS. Use only when you intentionally want public access.</li>
              <li><strong className="text-white">Tailnet IP:</strong> direct Tailnet binding with token auth, no Serve or Funnel automation.</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold tracking-tighter uppercase mt-12 mb-4">The Core Idea</h2>
          <p className="text-zinc-400 mb-6">
            OpenClaw has one Gateway that owns sessions, channels, auth, and state. Your browser, phone, desktop app, or
            node connects to that Gateway. For the safest setup, keep the Gateway bound to loopback and let SSH or
            Tailscale carry remote traffic to it.
          </p>

          <h2 className="text-2xl font-bold tracking-tighter uppercase mt-12 mb-4">Option 1: Remote over SSH</h2>
          <p className="text-zinc-400 mb-6">
            Choose SSH when you already have shell access to the host and want the most boring, reliable remote path.
            Agentbot stores the user choice for guidance, but it does not change the server exposure.
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto text-sm text-zinc-300 mb-6">
            <code>{sshCommand}</code>
          </pre>
          <p className="text-zinc-400 mb-6">
            With the tunnel open, connect tools and clients to <code className="text-orange-400">ws://127.0.0.1:18789</code>.
            SSH does not bypass Gateway auth, so keep your normal OpenClaw token or password ready.
          </p>

          <h2 className="text-2xl font-bold tracking-tighter uppercase mt-12 mb-4">Option 2: Tailscale Serve</h2>
          <p className="text-zinc-400 mb-6">
            Tailscale Serve is the recommended tailnet mode. The Gateway stays on loopback, and Tailscale provides HTTPS,
            routing, and identity headers inside your tailnet.
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto text-sm text-zinc-300 mb-6">
            <code>{`{
  "remoteAccess": {
    "type": "tailscale-serve",
    "authKey": "tskey-auth-...",
    "hostname": "agentbot-studio",
    "tags": ["tag:agentbot"]
  }
}`}</code>
          </pre>
          <p className="text-zinc-400 mb-6">
            Create the auth key in your own Tailscale admin console. Use an ephemeral key for short-lived agents, or a
            tagged reusable key for agents you expect to keep running.
          </p>

          <h2 className="text-2xl font-bold tracking-tighter uppercase mt-12 mb-4">Option 3: Tailscale Funnel</h2>
          <p className="text-zinc-400 mb-6">
            Funnel exposes the Gateway through public HTTPS. OpenClaw requires password auth for this mode, and Agentbot
            requires the password in the setup payload. Use Funnel only when public access is intentional.
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto text-sm text-zinc-300 mb-6">
            <code>{`{
  "remoteAccess": {
    "type": "tailscale-funnel",
    "authKey": "tskey-auth-...",
    "hostname": "agentbot-public-demo",
    "password": "shared-gateway-password"
  }
}`}</code>
          </pre>

          <h2 className="text-2xl font-bold tracking-tighter uppercase mt-12 mb-4">Option 4: Tailnet IP</h2>
          <p className="text-zinc-400 mb-6">
            Tailnet IP mode tells OpenClaw to bind directly to the Tailnet address with token auth. This skips Tailscale
            Serve and Funnel, so you connect with plain HTTP or WebSocket over your private tailnet.
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto text-sm text-zinc-300 mb-6">
            <code>{`{
  "remoteAccess": {
    "type": "tailnet",
    "authKey": "tskey-auth-...",
    "hostname": "agentbot-tailnet"
  }
}`}</code>
          </pre>
          <p className="text-zinc-400 mb-6">
            From another Tailnet device, connect to <code className="text-orange-400">http://&lt;tailscale-ip&gt;:18789/</code> or{' '}
            <code className="text-orange-400">ws://&lt;tailscale-ip&gt;:18789</code>.
          </p>

          <h2 className="text-2xl font-bold tracking-tighter uppercase mt-12 mb-4">Need Help Choosing?</h2>
          <p className="text-zinc-400 mb-6">
            Agentbot exposes a setup helper endpoint for product surfaces and API clients:
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto text-sm text-zinc-300 mb-6">
            <code>GET /api/remote-access/options</code>
          </pre>
          <p className="text-zinc-400 mb-6">
            It returns each remote access mode, required fields, optional fields, and setup steps. Use it to build a
            guided flow instead of asking users to know the network details up front.
          </p>

          <div className="border border-zinc-800 bg-zinc-950 p-6 mt-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400 mb-4">Security Rules</h2>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li>Keep the Gateway loopback-only unless you explicitly need Tailnet IP binding.</li>
              <li>Use SSH or Tailscale Serve for normal operator access.</li>
              <li>Use Funnel only with a shared password and a clear reason for public HTTPS.</li>
              <li>Never reuse a platform-owned Tailscale auth key for users. Users bring their own tailnet key.</li>
              <li>Gateway auth still matters. Remote access transports do not replace OpenClaw auth.</li>
            </ul>
          </div>
        </div>
      </article>
    </main>
  )
}
