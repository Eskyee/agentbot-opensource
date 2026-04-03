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
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Sponsor Agentbot & Build the Future of Agentic AI</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Sponsors</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Partnership</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Agentic AI</span>
 </div>
 </div>

 <p className="text-zinc-300 mb-4">We&apos;re inviting the community to sponsor Agentbot&apos;s development. Your support directly funds the future of autonomous AI agents - built by agents, for agents.</p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why Sponsor?</h2>
 <p className="text-zinc-300 mb-4">Agentbot is an open source project operated by Atlas_baseFM. We&apos;re building the infrastructure for agentic AI - and we want you to be part of it.</p>
 
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>Fund new features</strong> - Priority development on requested features</li>
 <li><strong>Support open source</strong> - Keep agent infrastructure free and accessible</li>
 <li><strong>Shape the roadmap</strong> - Sponsors influence what gets built next</li>
 <li><strong>Get exclusive access</strong> - Early access to beta features</li>
 <li><strong>Join the collective</strong> - Be part of the Agentbot community</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Partnership Opportunities</h2>
 <p className="text-zinc-300 mb-4">We&apos;re actively seeking partners to build the agentic AI ecosystem together:</p>
 
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">AI Providers</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Integrate your models into Agentbot marketplace</li>
 <li>Get featured as supported provider</li>
 <li>Joint marketing & developer outreach</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Channel Partners</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Add new messaging platforms (Slack, Teams, etc.)</li>
 <li>Build custom integrations for enterprise</li>
 <li>White-label solutions</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Payment Partners</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>x402 protocol expansion</li>
 <li>Multi-chain USDC payments</li>
 <li>Fiat on/off ramps</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Enterprise Partners</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Custom agent deployments</li>
 <li>SLA guarantees</li>
 <li>Dedicated support</li>
 <li>On-premise installations</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Sponsorship Tiers</h2>
 
 <div className="bg-zinc-950 p-6 mb-6">
 <h3 className="text-lg font-bold text-blue-400 mb-2">Supporter - $5/month</h3>
 <ul className="list-disc list-inside text-zinc-300 text-sm">
 <li>GitHub Sponsors badge</li>
 <li>Priority on community Discord</li>
 <li>Behind-the-scenes updates</li>
 </ul>
 </div>

 <div className="bg-zinc-950 p-6 mb-6">
 <h3 className="text-lg font-bold text-blue-400 mb-2">Builder - $25/month</h3>
 <ul className="list-disc list-inside text-zinc-300 text-sm">
 <li>All Supporter benefits</li>
 <li>Early access to beta features</li>
 <li>Monthly roadmap calls</li>
 <li>Discord #builders role</li>
 </ul>
 </div>

 <div className="bg-zinc-950 p-6 mb-6">
 <h3 className="text-lg font-bold text-yellow-400 mb-2">Partner - $100/month</h3>
 <ul className="list-disc list-inside text-zinc-300 text-sm">
 <li>All Builder benefits</li>
 <li>Direct roadmap input</li>
 <li>Monthly sync with team</li>
 <li>Logo on sponsors page</li>
 <li>Priority bug fixes</li>
 </ul>
 </div>

 <div className="bg-zinc-950 p-6 mb-6">
 <h3 className="text-lg font-bold text-blue-400 mb-2">Enterprise</h3>
 <ul className="list-disc list-inside text-zinc-300 text-sm">
 <li>Custom integrations</li>
 <li>Dedicated support channel</li>
 <li>SLA guarantees</li>
 <li>On-premise deployment options</li>
 <li>Custom contract & invoicing</li>
 </ul>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Our Vision</h2>
 <p className="text-zinc-300 mb-4">We&apos;re building Agentbot to be the infrastructure for agentic AI - where autonomous agents work together, share knowledge, and create value. This is a massive undertaking that benefits from community support.</p>
 
 <p className="text-zinc-300 mb-4">Every sponsor helps us:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Add more AI providers</li>
 <li>Build new marketplace agents</li>
 <li>Improve security & reliability</li>
 <li>Create better documentation</li>
 <li>Support self-hosting users</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Get Started</h2>
 <p className="text-zinc-300 mb-4">Ready to sponsor or partner with us?</p>
 
 <pre className="bg-zinc-950 p-4 text-zinc-300 mb-4 overflow-x-auto">
{`# Sponsor on GitHub
github.com/sponsors/Eskyee

# Contact for partnerships
dev@raveculture.xyz

# Join our Discord
discord.gg/vTPG4vdV6D`}
 </pre>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Thank You</h2>
 <p className="text-zinc-300 mb-4">Whether you sponsor $5 or $5,000, you&apos;re helping build the future of agentic AI. We&apos;re committed to being transparent with how funds are used and giving sponsors a real voice in our development.</p>
 
 <p className="text-zinc-300 mb-4">Let&apos;s build something incredible together.</p>

 <div className="mt-12 pt-8 border-t border-zinc-800">
 <p className="text-zinc-500">- The Agentbot Team </p>
 </div>
 </article>
 </div>
 </main>
 );
}
