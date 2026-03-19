import Link from 'next/link';

export default function WebhooksPost() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">January 2026</p>
            <h1 className="text-4xl font-bold mb-4">API Webhooks and External Integrations</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Tutorial</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Integrations</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-6">
            Connect your AI agent to external systems using webhooks, APIs, and custom workflows.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What Are Webhooks?</h2>
          <p className="text-gray-300 mb-4">
            Webhooks let your agent send data to external services when events occur. Perfect for notifications, logging, and automation.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Common Use Cases</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Send Slack notifications on new messages</li>
            <li>Log conversations to Airtable</li>
            <li>Trigger Zapier workflows</li>
            <li>Update CRM records</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Setting Up Webhooks</h2>
          <p className="text-gray-300 mb-4">
            Add webhook URLs in your agent settings. We'll POST JSON data to your endpoint on each message.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">API Integrations</h2>
          <p className="text-gray-300 mb-4">
            Your agent can call external APIs to fetch data, send emails, or trigger actions. Use our REST API to control agents programmatically.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Example: Slack Integration</h2>
          <p className="text-gray-300 mb-4">
            Configure a webhook to post agent responses to Slack. Perfect for team notifications.
          </p>

          <div className="mt-12 p-6 rounded-xl bg-gray-900 border border-gray-800">
            <p className="text-gray-300 mb-4">Start building integrations</p>
            <Link href="/signup" className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
