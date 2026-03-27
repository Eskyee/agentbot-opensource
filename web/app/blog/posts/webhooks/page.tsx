import Link from 'next/link';

export default function WebhooksPost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">January 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">API Webhooks and External Integrations</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Tutorial</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Integrations</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6">
 Connect your AI agent to external systems using webhooks, APIs, and custom workflows.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What Are Webhooks?</h2>
 <p className="text-zinc-300 mb-4">
 Webhooks let your agent send data to external services when events occur. Perfect for notifications, logging, and automation.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Common Use Cases</h2>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>Send Slack notifications on new messages</li>
 <li>Log conversations to Airtable</li>
 <li>Trigger Zapier workflows</li>
 <li>Update CRM records</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Setting Up Webhooks</h2>
 <p className="text-zinc-300 mb-4">
 Add webhook URLs in your agent settings. We&apos;ll POST JSON data to your endpoint on each message.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">API Integrations</h2>
 <p className="text-zinc-300 mb-4">
 Your agent can call external APIs to fetch data, send emails, or trigger actions. Use our REST API to control agents programmatically.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Example: Slack Integration</h2>
 <p className="text-zinc-300 mb-4">
 Configure a webhook to post agent responses to Slack. Perfect for team notifications.
 </p>

 <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
 <p className="text-zinc-300 mb-4">Start building integrations</p>
 <Link href="/signup" className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors">
 Get Started
 </Link>
 </div>
 </article>
 </div>
 </main>
 );
}
