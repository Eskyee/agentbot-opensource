import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Supabase Agent Skills — Agentbot',
  description: 'Official Supabase agent skills for building with Supabase correctly. Security, RLS, schema management, CLI + MCP.',
  keywords: ['Supabase', 'agent skills', 'RLS', 'database', 'MCP'],
}

const SKILLS = [
  {
    id: 'security-rls',
    name: 'Security & RLS',
    icon: '🔒',
    desc: 'Row Level Security policies, authentication patterns, data access controls. Build secure Supabase apps from day one.',
    category: 'Security',
  },
  {
    id: 'docs-knowledge',
    name: 'Docs & Product Knowledge',
    icon: '📚',
    desc: 'Deep knowledge of Supabase products — Auth, Storage, Realtime, Edge Functions, Vector. Build with the right tool for the job.',
    category: 'Knowledge',
  },
  {
    id: 'schema-management',
    name: 'Schema Management',
    icon: '🗄️',
    desc: 'Database migrations, schema design, indexing strategies, query optimization. Keep your data layer clean and performant.',
    category: 'Database',
  },
  {
    id: 'cli-mcp',
    name: 'CLI + MCP Instructions',
    icon: '⚡',
    desc: 'Supabase CLI commands, MCP server integration, local development workflow. Build and test locally before deploying.',
    category: 'Tools',
  },
  {
    id: 'auth-patterns',
    name: 'Authentication Patterns',
    icon: '🔑',
    desc: 'JWT handling, OAuth flows, magic links, passkeys, MFA. Secure auth flows that work across platforms.',
    category: 'Security',
  },
  {
    id: 'realtime',
    name: 'Realtime & Presence',
    icon: '📡',
    desc: 'Broadcast channels, presence tracking, database changes. Build collaborative features with Supabase Realtime.',
    category: 'Features',
  },
  {
    id: 'storage',
    name: 'File Storage',
    icon: '📁',
    desc: 'Upload, download, transform, and serve files. CDN-backed storage with access policies.',
    category: 'Features',
  },
  {
    id: 'edge-functions',
    name: 'Edge Functions',
    icon: '🌐',
    desc: 'Deno-based serverless functions. Webhook handlers, API proxies, background jobs. Deploy globally in seconds.',
    category: 'Compute',
  },
]

export default function SupabaseSkillsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <Link href="/dashboard/skills" className="text-zinc-400 hover:text-white mb-4 inline-block text-[10px] uppercase tracking-widest">
            ← Back to Skills
          </Link>
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Official Integration</div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Supabase Agent Skills</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Official Supabase agent skills for building with Supabase correctly. Security, RLS, 
            schema management, CLI + MCP. Teach your agent to build Supabase apps the right way.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {SKILLS.map(skill => (
            <div key={skill.id} className="border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-600 transition-colors">
              <div className="text-2xl mb-3">{skill.icon}</div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1">{skill.category}</div>
              <h3 className="text-sm font-bold text-white mb-2">{skill.name}</h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{skill.desc}</p>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-6 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-tight mb-4">What Your Agent Learns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Security First</div>
              <ul className="space-y-1 text-xs list-disc pl-4">
                <li>Always enable RLS on new tables</li>
                <li>Use auth.uid() in policies, never hardcode</li>
                <li>Validate inputs server-side</li>
                <li>Use service role key only in server contexts</li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Best Practices</div>
              <ul className="space-y-1 text-xs list-disc pl-4">
                <li>Use migrations for schema changes</li>
                <li>Index columns used in WHERE clauses</li>
                <li>Use Realtime for live features, not polling</li>
                <li>Test with local Supabase before deploying</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-orange-500 hover:text-orange-500 uppercase tracking-widest">
            Supabase Docs →
          </a>
          <a href="https://github.com/supabase/supabase" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-widest">
            GitHub →
          </a>
          <Link href="/dashboard/skills" className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-widest">
            All Skills →
          </Link>
        </div>
      </div>
    </main>
  )
}
