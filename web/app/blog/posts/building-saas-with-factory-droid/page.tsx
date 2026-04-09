import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Building a SaaS Platform with Factory Droid — From Zero to Production | Agentbot Blog',
  description: 'How we use Factory Droid custom droids to ship an AI agent SaaS platform faster than any team of 10. Real workflow, real code, real results.',
  keywords: ['Factory Droid', 'AI coding', 'SaaS', 'Agentbot', 'custom droids', 'developer tools', 'AI agents', 'build in public'],
  openGraph: {
    title: 'Building a SaaS Platform with Factory Droid',
    description: 'How one developer uses Factory Droid custom droids to ship an AI agent platform at startup speed.',
    url: 'https://agentbot.sh/blog/posts/building-saas-with-factory-droid',
  },
}

export default function BuildingSaaSWithFactoryDroid() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          &larr; Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              Building a SaaS Platform with Factory Droid
            </h1>
            <p className="text-lg text-zinc-400 mb-4">
              How one developer ships an AI agent platform at startup speed using custom droids as a virtual engineering team.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-green-800/50 text-zinc-400">Build Log</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Factory Droid</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">SaaS</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Developer Tools</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Build in Public</span>
            </div>
          </div>

          <Image
            src="/blog/factory-droid-cover.jpg"
            alt="Three AI droids — provisioner, skill-builder, and user-manager — connected to a central SaaS dashboard"
            width={1200}
            height={630}
            className="rounded-lg border border-zinc-800 mb-8"
            priority
          />

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Problem: One Dev, Entire Platform
          </h2>
          <p className="text-zinc-300 mb-4">
            Agentbot is a SaaS platform that provisions autonomous AI agent containers for the music and culture industry.
            Users sign up, pick a plan, and get a dedicated OpenClaw agent running on Railway in under 60 seconds.
            Behind that simple flow sits a Next.js frontend, an Express backend, Prisma ORM, Stripe billing,
            Railway container orchestration, 40+ API routes, and a skill marketplace with 45+ installable capabilities.
          </p>
          <p className="text-zinc-300 mb-6">
            I build it solo. No co-founder, no engineering team. Just me and Factory Droid.
          </p>

          <Image
            src="/blog/factory-droid-solo-dev.jpg"
            alt="Solo developer at a futuristic desk with holographic AI screens showing code and dashboards"
            width={1200}
            height={630}
            className="rounded-lg border border-zinc-800 mb-8"
          />

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What is Factory Droid?
          </h2>
          <p className="text-zinc-300 mb-4">
            <a href="https://factory.ai" className="text-white underline hover:text-zinc-300">Factory Droid</a> is
            an AI coding agent that lives in your terminal. It reads your codebase, understands your conventions,
            and executes multi-step engineering tasks. Think of it as a senior engineer who never sleeps,
            never forgets your auth patterns, and can spin up parallel workers for independent tasks.
          </p>
          <p className="text-zinc-300 mb-6">
            The real power is <strong className="text-white">custom droids</strong> &mdash; you write a markdown spec
            that teaches the AI your specific domain, and it becomes a specialist.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Our Custom Droid Fleet
          </h2>
          <Image
            src="/blog/factory-droid-droids-fleet.jpg"
            alt="Three AI robot droids with neon purple and green glow — the custom droid fleet"
            width={1200}
            height={630}
            className="rounded-lg border border-zinc-800 mb-6"
          />

          <p className="text-zinc-300 mb-4">
            We run three custom droids in our <code className="text-zinc-200">.factory/droids/</code> directory,
            each tuned for a different slice of the platform:
          </p>

          <div className="space-y-6 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">agent-provisioner</h3>
              <p className="text-zinc-400 text-sm mb-3">
                Knows the entire provisioning pipeline: auth gates, subscription checks, workload slots,
                Railway API calls, container resource limits per plan tier, OpenClaw env injection, health polling.
              </p>
              <p className="text-zinc-500 text-xs">
                Used for: deploying new agents, debugging failed provisions, scaling containers, managing Railway services
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">skill-builder</h3>
              <p className="text-zinc-400 text-sm mb-3">
                Understands the skill marketplace: Prisma Skill model, install/uninstall lifecycle,
                OpenClaw gateway deployment, skill categories, the 45+ default skills, and MCP tool proxying.
              </p>
              <p className="text-zinc-500 text-xs">
                Used for: creating new skills, wiring skill APIs, debugging gateway deploys, marketplace catalog management
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">user-manager</h3>
              <p className="text-zinc-400 text-sm mb-3">
                Handles the full user lifecycle: NextAuth multi-provider auth, registration with BotID protection,
                Stripe subscription tiers, 7-day trials, referral credits, admin access, email automation.
              </p>
              <p className="text-zinc-500 text-xs">
                Used for: debugging signups, subscription management, referral system, admin operations
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            How a Custom Droid Works
          </h2>
          <p className="text-zinc-300 mb-4">
            A custom droid is just a markdown file in <code className="text-zinc-200">.factory/droids/</code>.
            Here is the structure:
          </p>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto mb-4">
{`---
name: agent-provisioner
description: >-
  Provision, debug, and manage Agentbot AI agent
  containers. Use when deploying new agents,
  troubleshooting failed provisions, or managing
  the full agent lifecycle.
model: inherit
---
# Agent Provisioner Droid

You are an expert at provisioning and managing
Agentbot AI agent containers running the OpenClaw
runtime on Railway infrastructure.

## Key Files
- web/app/api/provision/route.ts
- agentbot-backend/src/lib/container-manager.ts
- web/prisma/schema.prisma

## Plan Tiers
| Plan | CPU | Memory | Price |
|------|-----|--------|-------|
| solo | 1 vCPU | 2 GB | £29/mo |
...`}
          </pre>
          <p className="text-zinc-300 mb-6">
            That is it. The droid reads the frontmatter for routing, then the body gives it domain expertise.
            When you or another droid spawns it as a subagent, it already knows your file paths, your data models,
            your security rules, and your common failure modes. No prompt engineering on every request.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Daily Workflow
          </h2>
          <Image
            src="/blog/factory-droid-workflow.jpg"
            alt="Futuristic code workflow terminal with neon cyan and pink holographic displays"
            width={1200}
            height={630}
            className="rounded-lg border border-zinc-800 mb-6"
          />

          <p className="text-zinc-300 mb-4">
            Here is what a typical day looks like building Agentbot with Factory Droid:
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 shrink-0">08:00</span>
                <span className="text-zinc-300"><strong className="text-white">&quot;Wire Solana dashboard with real data&quot;</strong> &mdash; Droid creates 3 API routes, rewrites the dashboard page, no new dependencies added</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 shrink-0">08:45</span>
                <span className="text-zinc-300"><strong className="text-white">&quot;Review the whole site for bugs&quot;</strong> &mdash; Spawns 2 parallel workers, returns 39 findings across 5 severity levels</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 shrink-0">09:30</span>
                <span className="text-zinc-300"><strong className="text-white">&quot;Create OpenClaw 2026.4.9 dashboards&quot;</strong> &mdash; 3 new dashboard pages + blog post + API proxy routes, all committed</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 shrink-0">10:15</span>
                <span className="text-zinc-300"><strong className="text-white">&quot;Study Kilo-Org/cloud and improve our UX&quot;</strong> &mdash; Deep competitor analysis, then implements StatusBadge, ConfirmDialog, toast system, 4 email templates</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 shrink-0">11:00</span>
                <span className="text-zinc-300"><strong className="text-white">&quot;Write MiMo sponsorship pitch&quot;</strong> &mdash; Production case study blog + outreach strategy document, ready to send</span>
              </div>
            </div>
          </div>

          <p className="text-zinc-300 mb-6">
            That is five major features before lunch. Each one verified with <code className="text-zinc-200">npm run build</code>,
            committed to git, deployed to Vercel. Factory Droid handles the build verification itself &mdash;
            if TypeScript fails, it fixes the errors and re-runs.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What Makes It Work
          </h2>

          <div className="space-y-4 mb-8">
            <div className="border-l-2 border-zinc-700 pl-4">
              <p className="text-white font-bold mb-1">Convention over configuration</p>
              <p className="text-zinc-400 text-sm">
                Droid reads your AGENTS.md, CLAUDE.md, and existing code. It matches your patterns &mdash;
                if you use Zod for validation, it uses Zod. If you use sonner for toasts, it uses sonner.
                No style drift.
              </p>
            </div>
            <div className="border-l-2 border-zinc-700 pl-4">
              <p className="text-white font-bold mb-1">Parallel workers</p>
              <p className="text-zinc-400 text-sm">
                For independent tasks, Droid spawns background agents. Code review runs in parallel with
                API route creation. Two workers scanning different parts of the codebase simultaneously.
              </p>
            </div>
            <div className="border-l-2 border-zinc-700 pl-4">
              <p className="text-white font-bold mb-1">Build-first verification</p>
              <p className="text-zinc-400 text-sm">
                Every change gets <code className="text-zinc-300">npm run build</code> before commit.
                TypeScript errors are caught and fixed automatically. No broken deployments pushed to main.
              </p>
            </div>
            <div className="border-l-2 border-zinc-700 pl-4">
              <p className="text-white font-bold mb-1">Domain expertise via custom droids</p>
              <p className="text-zinc-400 text-sm">
                The provisioner droid knows Railway GraphQL. The skill droid knows OpenClaw gateway ports.
                The user droid knows BotID protection. Specialisation beats general knowledge.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            By the Numbers
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">120+</p>
              <p className="text-xs text-zinc-500">API routes</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">45+</p>
              <p className="text-xs text-zinc-500">marketplace skills</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">3</p>
              <p className="text-xs text-zinc-500">custom droids</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">1</p>
              <p className="text-xs text-zinc-500">developer</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Getting Started with Custom Droids
          </h2>
          <p className="text-zinc-300 mb-4">
            If you are building a SaaS and want to try this workflow:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-zinc-300 mb-8">
            <li>
              <strong className="text-white">Install Factory Droid</strong> &mdash; follow the setup at{' '}
              <a href="https://factory.ai" className="text-white underline hover:text-zinc-300">factory.ai</a>
            </li>
            <li>
              <strong className="text-white">Write your AGENTS.md</strong> &mdash; document your project structure,
              conventions, and key files. This is the foundation Droid reads on every session.
            </li>
            <li>
              <strong className="text-white">Create your first custom droid</strong> &mdash; pick the most complex
              subsystem in your app (auth, billing, deployment) and write a specialist droid for it.
              Put it in <code className="text-zinc-200">.factory/droids/your-droid.md</code>.
            </li>
            <li>
              <strong className="text-white">Build in natural language</strong> &mdash; describe what you want.
              &quot;Wire the dashboard to real data.&quot; &quot;Debug why provision fails for trial users.&quot;
              &quot;Create a blog post about our latest release.&quot;
            </li>
            <li>
              <strong className="text-white">Let it verify</strong> &mdash; Droid runs your build, catches errors,
              fixes them. You review the diff and merge.
            </li>
          </ol>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Real Talk
          </h2>
          <p className="text-zinc-300 mb-4">
            Factory Droid is not magic. You still need to understand your architecture. You still need to
            review diffs. You still need to know when the AI is confidently wrong. But it collapses a
            10-person engineering sprint into a morning session for one developer. That is the difference
            between shipping and not shipping.
          </p>
          <p className="text-zinc-300 mb-4">
            Every feature on Agentbot &mdash; the skill marketplace, the buddies system, the Solana integration,
            the OpenClaw dashboards, the email automation, the conference recap blog posts &mdash; was built in
            this workflow. Describe, verify, ship.
          </p>
          <p className="text-zinc-300 mb-8">
            We are building in public because the tooling deserves it. If you are a solo founder or a small
            team shipping fast, this is the workflow. Custom droids are the unfair advantage.
          </p>

          <div className="border-t border-zinc-800 pt-8 mt-8">
            <p className="text-zinc-500 text-sm">
              Agentbot is open source at{' '}
              <a href="https://github.com/Eskyee/agentbot" className="text-white underline hover:text-zinc-300">
                github.com/Eskyee/agentbot
              </a>
              . Our custom droids are in the repo under <code className="text-zinc-400">.factory/droids/</code>.
              Try Factory Droid at{' '}
              <a href="https://factory.ai" className="text-white underline hover:text-zinc-300">
                factory.ai
              </a>.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
