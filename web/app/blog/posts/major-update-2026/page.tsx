import Link from 'next/link'

export default function MajorUpdatePost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <article className="max-w-3xl mx-auto px-6 py-16">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>

 <header className="mb-12">
 <h1 className="text-5xl font-bold uppercase tracking-tighter mb-4">Major Update: Agentbot Now Matches Kimi Claw</h1>
 <div className="flex items-center gap-4 text-zinc-400">
 <time>February 24, 2026</time>
 <span>•</span>
 <span>5 min read</span>
 </div>
 </header>

 <div className="prose prose-invert max-w-none">
 <p className="text-xl text-zinc-300 mb-8">
 Today we&apos;re launching the biggest update in Agentbot&apos;s history. After analyzing Kimi Claw&apos;s feature set, 
 we&apos;ve implemented everything they offer—while keeping our core advantages: multi-channel support, 
 model flexibility, and open-source foundation.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s New</h2>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Kimi K2.5 Thinking Model</h3>
 <p className="text-zinc-300 mb-4">
 We&apos;ve added support for Moonshot AI&apos;s advanced K2.5 Thinking model with 128K context window. 
 This model excels at complex reasoning tasks and is now available alongside GPT-4, Claude, 
 Gemini, and Groq models.
 </p>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Scheduled Tasks</h3>
 <p className="text-zinc-300 mb-4">
 Automate your agents with scheduled tasks. Use natural language like &quot;every day at 9am&quot; or 
 &quot;every Monday at 2pm&quot; and we&apos;ll convert it to cron format automatically. Perfect for:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>Daily reports and summaries</li>
 <li>Periodic data collection</li>
 <li>Automated customer outreach</li>
 <li>Regular system checks</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Skill Marketplace</h3>
 <p className="text-zinc-300 mb-4">
 Browse and install pre-built skills for your agents. Launch with 10+ skills including:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>Web Scraper - Extract data from any website</li>
 <li>Email Sender - Send emails via SMTP</li>
 <li>API Caller - Make HTTP requests</li>
 <li>PDF Generator - Create PDFs from HTML</li>
 <li>Slack Notifier - Send Slack notifications</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Custom Personalities</h3>
 <p className="text-zinc-300 mb-4">
 Configure how your agent communicates with 5 personality types:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li> Professional - Formal and business-focused</li>
 <li> Friendly - Casual and approachable</li>
 <li> Technical - Precise and detailed</li>
 <li> Creative - Playful and imaginative</li>
 <li> Concise - Brief and to-the-point</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">File Storage</h3>
 <p className="text-zinc-300 mb-4">
 Upload files for your agents to access. 10GB free tier, expandable to 50GB on Pro plans. 
 Perfect for storing documents, datasets, and reference materials.
 </p>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Agent Swarms</h3>
 <p className="text-zinc-300 mb-4">
 Deploy multiple agents that work together as a team. Define roles, assign models, and let 
 them coordinate on complex tasks. Example: Customer Support Team with Triage, Technical, 
 and Escalation agents.
 </p>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Visual Workflow Builder</h3>
 <p className="text-zinc-300 mb-4">
 Build no-code automation workflows with a drag-and-drop interface. Connect triggers, 
 actions, and conditions to create powerful automations without writing code.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">How We Compare to Kimi Claw</h2>

 <div className="bg-zinc-950 border border-zinc-800 p-6 mb-8">
 <h4 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Feature Parity</h4>
 <ul className="space-y-2 text-zinc-300">
 <li> Advanced AI models (K2.5 Thinking)</li>
 <li> Scheduled automation</li>
 <li> Skill library</li>
 <li> File storage</li>
 <li> Custom personalities</li>
 <li> Multi-agent coordination</li>
 </ul>
 </div>

 <div className="bg-blue-900/20 border border-blue-800 p-6 mb-8">
 <h4 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Our Advantages</h4>
 <ul className="space-y-2 text-zinc-300">
 <li> Multi-channel (Telegram, Discord, WhatsApp)</li>
 <li> Multi-model (GPT, Claude, Gemini, Groq, Kimi)</li>
 <li> Open source (OpenClaw foundation)</li>
 <li> More affordable pricing (£9/mo vs premium)</li>
 <li> Visual workflow builder</li>
 </ul>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Pricing</h2>
 <p className="text-zinc-300 mb-4">
 All new features are available on existing plans:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>Free Trial: 3 scheduled tasks, 5 skills, 1GB storage</li>
 <li>Starter (£9/mo): 10 tasks, unlimited skills, 10GB storage</li>
 <li>Pro (£29/mo): Unlimited tasks, swarms, workflows, 50GB storage</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Get Started</h2>
 <p className="text-zinc-300 mb-4">
 All features are live now. Log in to your dashboard and explore:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-8 space-y-2">
 <li> Tasks - Create your first scheduled task</li>
 <li> Skills - Browse the marketplace</li>
 <li> Personality - Customize your agent</li>
 <li> Swarms - Deploy a multi-agent team</li>
 <li> Workflows - Build visual automations</li>
 </ul>

 <div className="bg-zinc-950/50 border border-zinc-800 p-8 mt-12">
 <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Ready to try the new features?</h3>
 <Link 
 href="/dashboard"
 className="inline-block border border-zinc-800 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
 >
 Go to Dashboard →
 </Link>
 </div>

 <hr className="border-zinc-800 my-12" />

 <p className="text-zinc-400 text-sm">
 Questions? Reach out to us on{' '}
 <a href="https://twitter.com/agentbot" className="text-zinc-400 hover:text-white">Twitter</a>
 {' '}or{' '}
 <a href="https://github.com/Eskyee/agentbot" className="text-zinc-400 hover:text-white">GitHub</a>.
 </p>
 </div>
 </article>
 </main>
 )
}
