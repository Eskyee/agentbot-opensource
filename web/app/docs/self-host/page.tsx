import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Self-Host Agentbot - Docs',
  description: 'Run Agentbot on your own infrastructure with Next.js, PostgreSQL, and the Agentbot backend. Requirements, architecture, env vars, and deployment steps.',
  openGraph: {
    title: 'Self-Host Agentbot',
    description: 'Run the open source Agentbot stack on your own infrastructure.',
    url: buildAppUrl('/docs/self-host'),
  },
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-bold uppercase tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
      <code>{children}</code>
    </pre>
  )
}

export default function SelfHostPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Documentation</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Self-Host Agentbot
          </h1>
          <p className="max-w-3xl mx-auto text-sm leading-7 text-zinc-400">
            Agentbot is MIT licensed and can run on your own stack. This guide covers the practical path:
            Next.js frontend, PostgreSQL, the Agentbot backend, and the environment you need for channels,
            auth, billing, and production operations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-12">
          {[
            { label: 'Frontend', value: 'Next.js 16', detail: 'web/' },
            { label: 'Backend', value: 'Express', detail: 'agentbot-backend/' },
            { label: 'Database', value: 'PostgreSQL 15+', detail: 'Prisma-managed schema' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{item.label}</div>
              <div className="mt-3 text-lg font-bold text-white">{item.value}</div>
              <div className="mt-2 text-xs text-zinc-500">{item.detail}</div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <Section title="Minimum Requirements">
            <ul className="space-y-3 text-sm leading-6 text-zinc-300">
              <li>Node.js 20+</li>
              <li>PostgreSQL 15+ or a managed Postgres service like Neon</li>
              <li>1 GB RAM per concurrent agent container as a realistic floor</li>
              <li>Docker if you want isolated runtime containers beyond the web/control plane</li>
              <li>API keys for the providers you actually enable: Google/GitHub auth, OpenRouter/OpenAI, Stripe, Resend, Telegram, etc.</li>
            </ul>
          </Section>

          <Section title="Recommended Topology">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm font-bold text-white mb-2">1. Web App</div>
                <p className="text-xs leading-6 text-zinc-400">
                  Deploy `web/` as the product surface and API routes. In production it builds with
                  `next build --webpack` and runs from `.next/standalone/server.js`.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm font-bold text-white mb-2">2. Backend</div>
                <p className="text-xs leading-6 text-zinc-400">
                  Deploy `agentbot-backend/` separately for provisioning, runtime control, and backend-only services.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm font-bold text-white mb-2">3. Postgres</div>
                <p className="text-xs leading-6 text-zinc-400">
                  Use one shared database for users, sessions, agents, skills, claims, and dashboards.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Quick Start">
            <div className="space-y-5">
              <div>
                <div className="text-sm font-bold mb-2">Clone and install</div>
                <CodeBlock>{`git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource

cd web
npm install

cd ../agentbot-backend
npm install`}</CodeBlock>
              </div>

              <div>
                <div className="text-sm font-bold mb-2">Set environment variables</div>
                <CodeBlock>{`# web/.env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain
BACKEND_API_URL=https://your-backend-domain
INTERNAL_API_KEY=...

# Optional by feature:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
OPENROUTER_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
ADMIN_EMAILS=you@example.com

# agentbot-backend/.env
DATABASE_URL=postgresql://...
PORT=4000
JWT_SECRET=...
INTERNAL_API_KEY=...`}</CodeBlock>
              </div>

              <div>
                <div className="text-sm font-bold mb-2">Generate Prisma and run the app</div>
                <CodeBlock>{`cd web
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start

cd ../agentbot-backend
npm run build
npm run start`}</CodeBlock>
              </div>
            </div>
          </Section>

          <Section title="Production Contract">
            <ul className="space-y-3 text-sm leading-6 text-zinc-300">
              <li>`web/` must keep the `next build --webpack` build contract.</li>
              <li>`web/` production runtime is `node .next/standalone/server.js`.</li>
              <li>Use Prisma migrations or controlled raw SQL for schema changes that hit production routes.</li>
              <li>Do not hide runtime failures behind mock success data on production dashboards.</li>
            </ul>
          </Section>

          <Section title="Feature Flags And Optional Services">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm font-bold text-white mb-2">Payments & Billing</div>
                <p className="text-xs leading-6 text-zinc-400">
                  Stripe is optional for self-hosting. If you do not set Stripe keys, billing and checkout routes should stay disabled or internal-only.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm font-bold text-white mb-2">Channels</div>
                <p className="text-xs leading-6 text-zinc-400">
                  Telegram, Discord, WhatsApp, Resend, and similar channel integrations only need env values if you plan to enable them.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm font-bold text-white mb-2">KV / Cron Automation</div>
                <p className="text-xs leading-6 text-zinc-400">
                  Auto-blog and social cron features benefit from Upstash KV plus a `CRON_SECRET`. Without KV, those routes should degrade gracefully.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm font-bold text-white mb-2">Managed Runtime Controls</div>
                <p className="text-xs leading-6 text-zinc-400">
                  If you are not using Railway-managed runtimes, keep the web app deployed and disable or replace instance-control actions with your own orchestration.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Security Checklist">
            <ul className="space-y-3 text-sm leading-6 text-zinc-300">
              <li>Set `NEXTAUTH_SECRET` and backend secrets before exposing the app publicly.</li>
              <li>Lock `ADMIN_EMAILS` to known operators only.</li>
              <li>Do not leave demo or development routes enabled in production unless you explicitly intend to.</li>
              <li>Run `npm audit`, lint, and `npm run build` before each production release.</li>
              <li>Use TLS on both the web app and backend. Never expose internal control routes on plain HTTP.</li>
            </ul>
          </Section>

          <Section title="What This Guide Does Not Assume">
            <p className="text-sm leading-7 text-zinc-400">
              This guide does not assume Vercel, Railway, or any specific cloud vendor. The managed Agentbot product
              uses those platforms, but the self-host path is simply: run the Next.js app, run the backend, connect
              PostgreSQL, and only enable the integrations you actually need.
            </p>
          </Section>

          <Section title="Next Steps">
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/Eskyee/agentbot-opensource"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-white bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200 transition-colors"
              >
                View Open Source Repo
              </a>
              <a
                href="/documentation"
                className="inline-flex items-center justify-center border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
              >
                Back To Docs
              </a>
            </div>
          </Section>
        </div>
      </div>
    </main>
  )
}
