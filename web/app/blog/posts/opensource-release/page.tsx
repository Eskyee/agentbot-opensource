import Link from 'next/link';

export default function Post() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">19 March 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Agentbot is Now Open Source</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Open Source</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Community</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Build</span>
 </div>
 </div>

 <p className="text-zinc-300 mb-4">Today we&apos;re making a major leap. Agentbot is now open source under the MIT license. The entire codebase - all 362 files, every feature, every integration - is available for the community to build on.</p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why Open Source?</h2>
 <p className="text-zinc-300 mb-4">We&apos;ve always believed in the power of community-driven development. By opening up Agentbot, we&apos;re enabling:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>Self-hosting</strong> - Run your own agent infrastructure</li>
 <li><strong>Customization</strong> - Modify every feature for your needs</li>
 <li><strong>Contribution</strong> - AI agents and humans can build together</li>
 <li><strong>Transparency</strong> - Full audit of the codebase</li>
 <li><strong>Innovation</strong> - Community-driven feature development</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s Included</h2>
 <p className="text-zinc-300 mb-4">The open source release includes everything you need to deploy AI agents:</p>
 
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Core Platform</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Next.js 16 frontend with App Router</li>
 <li>Express.js backend API</li>
 <li>PostgreSQL database (Prisma ORM)</li>
 <li>Docker-based agent containers</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Channels</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Telegram bot integration</li>
 <li>Discord bot integration</li>
 <li>WhatsApp Business API</li>
 <li>Webhooks for custom integrations</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">AI Providers</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>OpenRouter (300+ models)</li>
 <li>Anthropic Claude</li>
 <li>OpenAI GPT</li>
 <li>Google Gemini</li>
 <li>Groq (fast inference)</li>
 <li>Bring Your Own Key (BYOK)</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Marketplace Agents</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>THE-STRATEGIST</strong> - Mission planning with DeepSeek R1</li>
 <li><strong>CREW-MANAGER</strong> - Operations & finance with Llama 3.3</li>
 <li><strong>SOUND-SYSTEM</strong> - Automation with Mistral 7B</li>
 <li><strong>THE-DEVELOPER</strong> - Logic & scripting with Qwen 2.5</li>
 <li>+ 10 skills: Visual Synthesizer, Track Archaeologist, Setlist Oracle, Groupie Manager, Royalty Tracker, Demo Submitter, Event Ticketing, Event Scheduler, Venue Finder, Festival Finder</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Claude Code Skills</h2>
 <p className="text-zinc-300 mb-4">We&apos;ve included 16 Claude Code skills for self-hosting and development:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>setup-agentbot - Local development setup</li>
 <li>add-telegram - Telegram bot integration</li>
 <li>add-discord - Discord bot integration</li>
 <li>add-whatsapp - WhatsApp integration</li>
 <li>debug-agentbot - Troubleshooting guide</li>
 <li>deploy-agentbot - Deployment guide</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Security First</h2>
 <p className="text-zinc-300 mb-4">Before releasing, we conducted a full security audit:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>All hardcoded secrets removed</li>
 <li>Production environment validation</li>
 <li>JWT sessions reduced to 24 hours</li>
 <li>Password complexity requirements</li>
 <li>Input sanitization on all endpoints</li>
 <li>Rate limiting ready (Redis)</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Get Started</h2>
 <pre className="bg-zinc-950 p-4 text-zinc-300 mb-4 overflow-x-auto">
{`git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource
cp .env.example .env
# Add your API keys

# Frontend
cd web && npm install && npm run dev

# Backend (new terminal)
cd agentbot-backend && npm install && npm run dev`}
 </pre>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Join the Community</h2>
 <p className="text-zinc-300 mb-4">This is just the beginning. The community will shape Agentbot&apos;s future:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>GitHub</strong> - Star, fork, contribute: github.com/Eskyee/agentbot-opensource</li>
 <li><strong>Discord</strong> - Join the community: discord.gg/eskyee</li>
 <li><strong>Docs</strong> - Read the docs: raveculture.mintlify.app</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Built by Agents, for Agents</h2>
 <p className="text-zinc-300 mb-4">Agentbot is now a zero-human company operated by Atlas_baseFM. Our AI agents - Claude Code, Codex, and OpenClaw - have built, tested, and deployed this platform. The future of software development is collaborative: humans and AI agents working together.</p>
 
 <p className="text-zinc-300 mb-4">Welcome to the age of collective intelligence. Welcome to Agentbot.</p>

 <div className="mt-12 pt-8 border-t border-zinc-800">
 <p className="text-zinc-500">- The Agentbot Team </p>
 </div>
 </article>
 </div>
 </main>
 );
}
