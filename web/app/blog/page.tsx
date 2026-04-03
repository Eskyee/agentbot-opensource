'use client';

import Link from 'next/link';
import { useState } from 'react';

const blogPosts = [
  {
    slug: 'btcpay-agentbot',
    date: '3 Apr',
    title: 'BTCPay Agentbot: Bitcoin-Native Agent Payments',
    excerpt: 'Headless Bitcoin infrastructure for AI agents. Non-custodial wallets, A2A BTC payments, Fast Sync, 10GB pruned nodes.',
    tags: ['Bitcoin', 'Payments'],
    featured: true
  },
  {
    slug: 'how-we-built-multi-tenant-agent-platform',
    date: '2 Apr',
    title: 'How We Built a Multi-Tenant AI Agent Platform',
    excerpt: 'BYOK infrastructure, OpenClaw gateway, 8 channels, Docker agent containers. Open-sourced the architecture.',
    tags: ['Open Source', 'Architecture']
  },
  {
    slug: 'agentbot-showcase-trials-live',
    date: '2 Apr',
    title: 'Trials Live, Showcase Open',
    excerpt: '7-day free trials, public agent showcase, Stripe payments. Built in a month from a Mac mini in London.',
    tags: ['Launch']
  },
  {
    slug: 'platform-update-april-2026',
    date: '2 Apr',
    title: 'April Update — Orchestration Engine & v1.0.0',
    excerpt: 'Concurrent tool orchestration, tiered permission gates, encrypted per-user keys, and v1.0.0 open source release.',
    tags: ['Release']
  },
  {
    slug: 'pre-launch-hardening-2026-03-30',
    date: '30 Mar',
    title: 'Pre-Launch Hardening: Payment Audit',
    excerpt: '5 critical payment gaps found and fixed. Every endpoint locked down before D-1 launch.',
    tags: ['Security']
  },
  {
    slug: 'agentbot-launch',
    date: '31 Mar',
    title: 'Agentbot Launches March 31',
    excerpt: 'Your AI agent. Your hardware. Your rules. Self-hosted, BYOK, one command deploy.',
    tags: ['Launch']
  },
  {
    slug: 'openclaw-v2026-3-24',
    date: '26 Mar',
    title: 'OpenClaw v2026.3.24',
    excerpt: 'Gateway OpenAI compatibility, security fix, CLI container support, channel isolation.',
    tags: ['Release']
  },
  {
    slug: 'mimo-v2-pro',
    date: '23 Mar',
    title: 'MiMo-V2-Pro: Xiaomi\'s Flagship AI Model',
    excerpt: '1T+ parameters, 1M context, #1 in programming benchmarks. Now the default model on Agentbot.',
    tags: ['Models']
  },
  {
    slug: 'launch-week-2026-3-21',
    date: '21 Mar',
    title: '313 Commits in One Week',
    excerpt: 'Security hardening, RLS, real agent provisioning, BullMQ worker, design system locked.',
    tags: ['Build Log']
  },
  {
    slug: 'underground-agents-drop',
    date: '24 Feb',
    title: 'Underground Agents Drop',
    excerpt: 'Rave Event Agent and Community Treasury Agent — crypto-native tools for underground collectives.',
    tags: ['Release']
  },
  {
    slug: 'zero-human-company',
    date: '14 Mar',
    title: 'Running a Zero-Human Company',
    excerpt: 'How Atlas operates autonomously — deployments, support, trading, content creation.',
    tags: ['AI']
  },
  {
    slug: 'battle-tested',
    date: '14 Mar',
    title: 'Battle Tested: Live in the Field',
    excerpt: 'Real problems, real solutions, zero marketing fluff.',
    tags: ['Philosophy']
  },
];

const allTags = ['All', ...Array.from(new Set(blogPosts.flatMap(p => p.tags)))];

export default function BlogPage() {
  const [activeTag, setActiveTag] = useState('All');

  const filtered = activeTag === 'All'
    ? blogPosts
    : blogPosts.filter(p => p.tags.includes(activeTag));

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Hero */}
      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">News & Updates</p>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.9]">
            What We&apos;re<br />
            <span className="text-zinc-700">Shipping</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-lg mt-6 leading-relaxed">
            Product updates, engineering deep dives, and guides for running AI agents in production.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest whitespace-nowrap border transition-colors ${
                  activeTag === tag
                    ? 'border-white text-white'
                    : 'border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="border-b border-zinc-900">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
            <Link href={`/blog/posts/${featured.slug}`} className="group block">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">{featured.date}</span>
                {featured.tags.map(t => (
                  <span key={t} className="text-[10px] uppercase tracking-widest text-blue-500">{t}</span>
                ))}
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-tight mb-4 group-hover:text-zinc-300 transition-colors">
                {featured.title}
              </h2>
              <p className="text-zinc-500 text-sm sm:text-base max-w-2xl leading-relaxed mb-4">
                {featured.excerpt}
              </p>
              <span className="text-xs uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                Read more →
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Grid */}
      <section>
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/posts/${post.slug}`}
                className="bg-black p-6 sm:p-8 group hover:bg-zinc-900/30 transition-colors flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">{post.date}</span>
                  {post.tags.map(t => (
                    <span key={t} className="text-[10px] uppercase tracking-widest text-zinc-600">{t}</span>
                  ))}
                </div>
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-tighter leading-snug mb-3 group-hover:text-zinc-300 transition-colors">
                  {post.title}
                </h3>
                <p className="text-zinc-600 text-xs leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <span className="text-[10px] uppercase tracking-widest text-zinc-700 group-hover:text-zinc-400 transition-colors mt-4">
                  Read →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Roadmap</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase leading-none mb-10">Coming Next</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {[
              { status: 'Live', title: 'BTCPay Agentbot', desc: 'Bitcoin-native agent payments', color: 'text-green-500' },
              { status: 'In Progress', title: 'Custom Domains', desc: 'Deploy to your own .com', color: 'text-blue-500' },
              { status: 'In Progress', title: 'Metrics Dashboard', desc: 'Real-time usage graphs', color: 'text-blue-500' },
              { status: 'Coming Soon', title: 'WhatsApp', desc: 'Deploy agents to WA', color: 'text-zinc-500' },
            ].map((item) => (
              <div key={item.title} className="bg-black p-6 sm:p-8">
                <span className={`text-[10px] uppercase tracking-widest font-bold ${item.color}`}>{item.status}</span>
                <h3 className="font-bold uppercase tracking-tighter text-sm mt-3 mb-1">{item.title}</h3>
                <p className="text-zinc-600 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
