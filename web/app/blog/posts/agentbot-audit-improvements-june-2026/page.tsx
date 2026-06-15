import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot Security Audit & A+ Grade Improvements — June 2026',
  description:
    'How we ran a comprehensive security audit, fixed 20+ findings, eliminated all critical vulnerabilities, and achieved an A+ code quality grade.',
}

export default function BlogPost() {
  return (
    <article className="prose prose-invert max-w-3xl mx-auto px-6 py-24">
      <p className="text-zinc-500 text-sm">10 Jun 2026 · Agentbot Team</p>

      <h1 className="text-3xl font-bold mt-4">
        Security Audit & A+ Grade: How We Hardened Agentbot in One Day
      </h1>

      <p className="text-zinc-400 text-lg mt-4">
        We ran a comprehensive 4-phase security audit on the agentbot codebase, fixed every Critical and
        High finding, eliminated all <code>as any</code> type assertions, replaced 68 console calls with
        structured logging, and achieved an A+ code quality grade — all in a single day.
      </p>

      <h2 className="text-2xl font-bold mt-10">The Audit</h2>

      <p>
        Using a structured audit methodology inspired by Claude Fable 5&apos;s audit prompt, we analyzed
        the entire agentbot monorepo across 8 dimensions: architecture, code quality, security, testing,
        performance, dependencies, DevEx, and documentation.
      </p>

      <p>The audit identified 28 findings:</p>

      <ul>
        <li><strong>3 Critical</strong> timing side-channel vulnerabilities</li>
        <li><strong>4 High</strong> security issues (SSRF proxy, command injection, auth bypass)</li>
        <li><strong>6 Medium</strong> code quality issues</li>
        <li><strong>2 Low</strong> infrastructure issues</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10">Critical Security Fixes</h2>

      <h3 className="text-xl font-bold mt-6">1. Timing Side-Channel Attacks</h3>

      <p>
        Five authentication endpoints were using <code>===</code> or <code>!==</code> to compare secrets,
        allowing attackers to enumerate API keys character-by-character by measuring response times.
      </p>

      <p>
        <strong>Fix:</strong> Created a shared <code>safeCompare()</code> utility using{' '}
        <code>crypto.timingSafeEqual</code> and applied it to all auth paths:
      </p>

      <ul>
        <li><code>cron.ts</code> — CRON_SECRET comparison</li>
        <li><code>ops/runs/log/route.ts</code> — INTERNAL_API_KEY comparison</li>
        <li><code>ops/metrics/collect/route.ts</code> — INTERNAL_API_KEY + BRIDGE_SECRET</li>
        <li><code>hooks/classify/route.ts</code> — Bearer token validation</li>
        <li><code>provision/route.ts</code> — Bridge secret validation</li>
      </ul>

      <h3 className="text-xl font-bold mt-6">2. Unauthenticated SSRF Proxy</h3>

      <p>
        The <code>/api/openclaw/proxy/</code> path explicitly bypassed authentication, allowing any
        unauthenticated user to proxy HTTP requests to internal Railway services.
      </p>

      <p>
        <strong>Fix:</strong> Removed the auth bypass middleware and applied <code>authenticate</code> to
        all OpenClaw routes.
      </p>

      <h3 className="text-xl font-bold mt-6">3. Command Injection in Bridge Client</h3>

      <p>
        The bridge client used <code>execSync</code> with string concatenation, allowing shell injection
        via crafted prompts.
      </p>

      <p>
        <strong>Fix:</strong> Replaced <code>execSync</code> with <code>spawn</code> using array arguments
        (no shell).
      </p>

      <h2 className="text-2xl font-bold mt-10">Structural Improvements</h2>

      <h3 className="text-xl font-bold mt-6">Index.ts: 1,128 → 227 Lines</h3>

      <p>
        The 1,128-line god file was extracted into 7 focused modules:
      </p>

      <ul>
        <li><code>lib/docker.ts</code> — Docker container operations</li>
        <li><code>lib/ports.ts</code> — Port management with Postgres advisory lock</li>
        <li><code>lib/agent-metadata.ts</code> — Agent metadata read/write</li>
        <li><code>lib/auto-update.ts</code> — OpenClaw auto-update logic</li>
        <li><code>routes/deployments.ts</code> — POST /api/deployments</li>
        <li><code>routes/subscriptions.ts</code> — POST /api/subscriptions/deploy</li>
        <li><code>index.ts</code> — Thin entry point (227 lines)</li>
      </ul>

      <h3 className="text-xl font-bold mt-6">Unified Plan Definitions</h3>

      <p>
        Three separate plan definitions (starter/pro/scale in billing, solo/collective/label/network in
        backend) were unified to use consistent names across the codebase.
      </p>

      <h3 className="text-xl font-bold mt-6">CryptoJS → Node Crypto</h3>

      <p>
        Wallet encryption was migrated from CryptoJS (MD5-based key derivation) to Node&apos;s built-in
        <code>crypto</code> module using AES-256-GCM with proper salt, IV, and auth tag. Legacy CryptoJS
        data is still supported via fallback decryption.
      </p>

      <h2 className="text-2xl font-bold mt-10">Code Quality</h2>

      <h3 className="text-xl font-bold mt-6">Zero Console Calls</h3>

      <p>
        68 <code>console.error/warn/log</code> calls were replaced with structured logging via the{' '}
        <code>log</code> utility, enabling JSON-formatted output for production observability.
      </p>

      <h3 className="text-xl font-bold mt-6">Zero Type Assertions</h3>

      <p>
        All 14 <code>as any</code> type assertions were eliminated, replacing them with proper type
        annotations (<code>Record&lt;string, unknown&gt;</code>, typed interfaces, etc.).
      </p>

      <h3 className="text-xl font-bold mt-6">68 Tests Passing</h3>

      <p>
        Added comprehensive test coverage for:
      </p>

      <ul>
        <li>Auth middleware (timingSafeEqual verification)</li>
        <li>Wallet encryption (AES-256-GCM roundtrip)</li>
        <li>AI service (model selection, system prompts)</li>
        <li>Agent bus (signature verification, replay protection)</li>
        <li>Orchestrator (deploy, stop, start, delete)</li>
        <li>Soul service (getSoul, updateSoul)</li>
        <li>Secure-exec (retry logic, timeout handling)</li>
        <li>React components (CreditBadge, Breadcrumbs)</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10">CI/CD Improvements</h2>

      <ul>
        <li>Added lint & secret scan job to GitHub Actions</li>
        <li>Removed 6 stale markdown files (TASKS, SESSION_NOTES, CODE_REVIEW, etc.)</li>
        <li>Fixed smoke-test-review test to run in CI (jose ESM mock)</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10">Learning from MiMo Code</h2>

      <p>
        Xiaomi&apos;s MiMo Code team recently published their approach to building coding agents that
        handle long-horizon tasks. Their three-pillar design — <strong>computation</strong>,{' '}
        <strong>memory</strong>, and <strong>evolution</strong> — aligns with our own approach to agentbot:
      </p>

      <ul>
        <li>
          <strong>Computation:</strong> MiMo Code uses parallel sampling and completion verification.
          Our tiered permission system and structured logging provide similar guardrails for agent execution.
        </li>
        <li>
          <strong>Memory:</strong> MiMo Code&apos;s 4-layer memory system (session, project, global,
          history) mirrors our own memory architecture in OpenClaw — persistent memory per agent, project
          context, and session state.
        </li>
        <li>
          <strong>Evolution:</strong> MiMo Code&apos;s Dream and Distill cycles for memory maintenance
          are analogous to our agent learning system that promotes experiences across sessions.
        </li>
      </ul>

      <p>
        We&apos;re exploring integrating MiMo Code&apos;s Dynamic Workflow concept — turning orchestration
        logic from prompt into deterministic code — to improve reliability in our provisioning and
        deployment pipelines.
      </p>

      <h2 className="text-2xl font-bold mt-10">Final Score</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-2">Metric</th>
            <th className="text-left py-2">Before</th>
            <th className="text-left py-2">After</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-800">
            <td className="py-2">Audit Grade</td>
            <td className="py-2 text-zinc-500">C+</td>
            <td className="py-2 text-green-400">A+</td>
          </tr>
          <tr className="border-b border-zinc-800">
            <td className="py-2">Critical Vulnerabilities</td>
            <td className="py-2 text-zinc-500">3</td>
            <td className="py-2 text-green-400">0</td>
          </tr>
          <tr className="border-b border-zinc-800">
            <td className="py-2">Console.* Calls</td>
            <td className="py-2 text-zinc-500">68</td>
            <td className="py-2 text-green-400">0</td>
          </tr>
          <tr className="border-b border-zinc-800">
            <td className="py-2">Type Assertions (as any)</td>
            <td className="py-2 text-zinc-500">14</td>
            <td className="py-2 text-green-400">0</td>
          </tr>
          <tr className="border-b border-zinc-800">
            <td className="py-2">Tests</td>
            <td className="py-2 text-zinc-500">~20 (mock app)</td>
            <td className="py-2 text-green-400">68 (real routes)</td>
          </tr>
          <tr className="border-b border-zinc-800">
            <td className="py-2">index.ts Lines</td>
            <td className="py-2 text-zinc-500">1,128</td>
            <td className="py-2 text-green-400">227</td>
          </tr>
          <tr>
            <td className="py-2">Stale Files</td>
            <td className="py-2 text-zinc-500">6</td>
            <td className="py-2 text-green-400">0</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-2xl font-bold mt-10">Remaining Dependencies</h2>

      <p>
        11 moderate-severity vulnerabilities remain in deep dependencies (ethers, next-auth, ws) that
        require breaking major version upgrades. These are tracked and will be addressed in upcoming
        dependency update cycles.
      </p>

      <h2 className="text-2xl font-bold mt-10">What&apos;s Next</h2>

      <ul>
        <li>Deploy backend to Railway (pending infrastructure setup)</li>
        <li>Expand React component test coverage</li>
        <li>Integrate Dynamic Workflow for provisioning pipelines</li>
        <li>Add monitoring dashboards for production observability</li>
      </ul>

      <p className="text-zinc-500 text-sm mt-10">
        Full audit report:{' '}
        <code>agentbot/AUDIT.md</code>
      </p>
    </article>
  )
}
