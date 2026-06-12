import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot API Collection — Full Coverage Across 15 Modules',
  description:
    'The Agentbot API collection has been fully built out and synced from the codebase, covering all major surface areas across 15 organized folders.',
}

export default function BlogPost() {
  return (
    <article className="prose prose-invert max-w-3xl mx-auto px-6 py-24">
      <p className="text-zinc-500 text-sm">12 Jun 2026 · Agentbot Team</p>

      <h1 className="text-3xl font-bold mt-4">
        Agentbot API Collection — Full Coverage Across 15 Modules
      </h1>

      <p className="text-zinc-400 text-lg mt-4">
        The Agentbot API collection has been fully built out and synced from the codebase. It now
        covers all major surface areas of the platform across 15 organized folders.
      </p>

      <h2 className="text-2xl font-bold mt-10">Why This Matters</h2>

      <p>
        When you&apos;re building on Agentbot — whether it&apos;s integrating agents into your
        workflow, automating provisioning, or building custom dashboards — you need reliable API
        access. The Postman collection is the single source of truth for every endpoint the platform
        exposes.
      </p>

      <p>
        We&apos;ve synced it directly from the codebase. Every route handler in{' '}
        <code>web/app/api/</code> and every Express endpoint in{' '}
        <code>agentbot-backend/src/</code> has a corresponding request in the collection.
      </p>

      <h2 className="text-2xl font-bold mt-10">The 15 Modules</h2>

      <h3 className="text-xl font-bold mt-6">1. Agents</h3>
      <p>
        Full CRUD for agent management — create, read, update, delete. Plus clone, verify, sync,
        and simulator endpoints for testing agent behavior without live execution.
      </p>

      <h3 className="text-xl font-bold mt-6">2. Auth</h3>
      <p>
        Login, OAuth flows (Google, Farcaster, Wallet), session management, CSRF protection, and
        token gating. Every authentication pattern the platform supports.
      </p>

      <h3 className="text-xl font-bold mt-6">3. Provisioning</h3>
      <p>
        Agent and team provisioning, Railway deploy triggers, job status polling, and metrics
        endpoints. The full lifecycle from &quot;spin up&quot; to &quot;running in production.&quot;
      </p>

      <h3 className="text-xl font-bold mt-6">4. Instance Management</h3>
      <p>
        Start, stop, restart, and repair agent instances. Memory reset, token refresh, and stats
        endpoints for monitoring instance health.
      </p>

      <h3 className="text-xl font-bold mt-6">5. AI &amp; Chat</h3>
      <p>
        Chat completions, TTS generation, model selection, cost estimation, and the gateway proxy
        for routing requests through OpenRouter.
      </p>

      <h3 className="text-xl font-bold mt-6">6. Dashboard &amp; Metrics</h3>
      <p>
        Analytics, bootstrap data, cost breakdowns, health checks, platform stats, and usage
        tracking. Everything your dashboard needs to render.
      </p>

      <h3 className="text-xl font-bold mt-6">7. Mission Control</h3>
      <p>
        Fleet bookings, cost allocation, execution graphs, and trace endpoints. For teams managing
        multiple agents at scale.
      </p>

      <h3 className="text-xl font-bold mt-6">8. Bridge</h3>
      <p>
        Send, poll, and inbox endpoints for agent-to-agent communication. Health checks and setup
        routes for the bridge service.
      </p>

      <h3 className="text-xl font-bold mt-6">9. Social</h3>
      <p>
        Feed, posts, comments, DMs, notifications, and agent registration. The full social graph
        API for community features.
      </p>

      <h3 className="text-xl font-bold mt-6">10. Admin</h3>
      <p>
        User management, security controls, audit logging, DB health, MiMo configuration, and seed
        usage tracking. Operator-level endpoints.
      </p>

      <h3 className="text-xl font-bold mt-6">11. Health &amp; Status</h3>
      <p>
        Web, backend, AI, gateway, and x402 health checks. Simple GET endpoints that return 200
        when services are healthy.
      </p>

      <h3 className="text-xl font-bold mt-6">12. Registration &amp; Keys</h3>
      <p>
        API key CRUD — create, rotate, revoke. Invite code generation and validation for team
        onboarding.
      </p>

      <h3 className="text-xl font-bold mt-6">13. User &amp; Settings</h3>
      <p>
        Profile updates, BYOK (bring your own key) configuration, password management, wallet
        connections, and Stripe billing.
      </p>

      <h3 className="text-xl font-bold mt-6">14. Bitcoin &amp; Solana</h3>
      <p>
        Bitcoin wallet management via Greenlight and Liquid. Solana RPC endpoints and price feeds
        for multi-chain agents.
      </p>

      <h3 className="text-xl font-bold mt-6">15. OpenClaw Backend</h3>
      <p>
        Deployments, instance management, permissions, and version endpoints for the OpenClaw
        backend service.
      </p>

      <h2 className="text-2xl font-bold mt-10">Environment Setup</h2>

      <p>All requests use the Agentbot Environment for variable resolution:</p>

      <ul>
        <li>
          <code>{'{{baseUrl}}'}</code> — the web frontend (Vercel)
        </li>
        <li>
          <code>{'{{backendUrl}}'}</code> — the Express backend on port 4000
        </li>
      </ul>

      <p>
        Import the environment file from the Postman collection settings, and all requests resolve
        automatically.
      </p>

      <h2 className="text-2xl font-bold mt-10">What&apos;s Next</h2>

      <p>
        The collection will continue to evolve as we add new endpoints. Every API route that ships
        in a PR gets a corresponding Postman request before merge. If you spot a missing endpoint,
        open an issue — we&apos;ll add it.
      </p>

      <p className="text-zinc-500 text-sm mt-10">
        Questions? Reach out on{' '}
        <a href="https://t.me/esky33" className="text-green-400 hover:text-green-300">
          Telegram
        </a>{' '}
        or{' '}
        <a href="https://discord.gg/agentbot" className="text-green-400 hover:text-green-300">
          Discord
        </a>
        .
      </p>
    </article>
  )
}
