import type { Metadata } from 'next'
import Link from 'next/link'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Why Agentbot? — Cloud AI Agents vs Local Setup',
  description: 'Discover why Agentbot beats running OpenClaw locally. 24/7 uptime, instant skills, Telegram/Discord/WhatsApp channels — no terminal commands, no server costs. From £29/mo.',
  keywords: ['why Agentbot', 'AI agent cloud hosting', 'OpenClaw cloud', 'deploy AI agent', 'BYOK AI agent', 'AI agent vs local'],
  openGraph: {
    title: 'Why Agentbot? Cloud AI Agents vs Local Setup',
    description: 'No hardware. No terminal. 24/7 AI agents with persistent memory, skills, and multi-channel deployment.',
    url: buildAppUrl('/why'),
  },
  alternates: {
    canonical: buildAppUrl('/why'),
  },
}

const PRICE_START = "£29/mo";

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Agentbot free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Plans start at £29/mo for the Underground plan. One-click cloud deployment is available on all paid plans. If you already run OpenClaw locally, you can link it to Agentbot for free.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Agentbot?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Agentbot is a cloud-based AI assistant platform that deploys OpenClaw to the cloud in one click. You get a 24/7 personal AI assistant with long-term memory, customizable personality, ready-to-use skills, and multi-channel access via Telegram, Discord, and WhatsApp — all without server setup or terminal commands.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can Agentbot handle crypto transactions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Agentbot integrates with Coinbase Agentic Wallet, enabling your agent to execute onchain transactions autonomously. Your agent can send payments, interact with smart contracts, swap tokens, mint NFTs, and manage crypto assets through natural language commands.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use the terminal to control Agentbot?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Agentbot does not currently support direct terminal access. A terminal UI is coming soon. For now, you can send commands via chat (Telegram, Discord, WhatsApp) and let Agentbot execute them for you.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I deploy a pre-configured agent?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Visit the marketplace to browse pre-configured agent templates including basefmbot (Onchain Radio Agent), cafe (customer service), chain (Crypto Agent), and more. Choose a template, customize it, and deploy in one click.',
      },
    },
  ],
}

export default function WhyAgentbotPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-blue-500 hover:underline mb-8 inline-block text-xs uppercase tracking-widest">
          Back to Home
        </Link>

        <header className="mb-12">
          <h1 className="text-5xl font-bold uppercase tracking-tighter mb-6">
            Why Agentbot?
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Local OpenClaw agents are powerful, but they come with real friction. You need to install dependencies, configure API keys, and keep your machine running constantly. Your agent stops when you close your laptop. Adding new skills means searching ClawHub, downloading files, and troubleshooting errors. If you want 24/7 uptime, you&apos;ll need to buy a VPS or leave a Mac Mini running at home.
          </p>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
            <strong className="text-white">Agentbot removes all of this.</strong> It deploys OpenClaw to the cloud in one click, runs 24/7 without hardware, and gives you instant access to ready-to-use skills through Telegram, Discord, and WhatsApp. No terminal commands, no server costs, no installation headaches.
          </p>
        </header>

        <nav className="border border-zinc-800 bg-black p-5 mb-12">
          <h2 className="text-lg font-bold uppercase tracking-tighter mb-4">Table of Contents</h2>
          <ul className="space-y-2 text-zinc-400 text-sm">
            <li><a href="#comparison" className="hover:text-white">&mdash; Quick comparison: Agentbot vs. Local OpenClaw</a></li>
            <li><a href="#features" className="hover:text-white">&mdash; Features that actually matter</a></li>
            <li><a href="#how-to" className="hover:text-white">&mdash; How to use Agentbot?</a></li>
            <li><a href="#use-cases" className="hover:text-white">&mdash; Real-world use cases</a></li>
            <li><a href="#conclusion" className="hover:text-white">&mdash; Conclusion</a></li>
          </ul>
        </nav>

        <section id="comparison" className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Comparison</span>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-6">Quick comparison: Agentbot vs. Local OpenClaw</h2>
          <p className="text-sm text-zinc-400 mb-6">
            The table below compares Agentbot with traditional local OpenClaw setup to help you understand what changes:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-500">Feature</th>
                  <th className="text-left p-4 bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-500">Agentbot (Cloud)</th>
                  <th className="text-left p-4 bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-500">Local OpenClaw</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400 text-sm">
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-medium text-white">Setup Complexity</td>
                  <td className="p-4 bg-zinc-950">One-click cloud setup, ready in seconds</td>
                  <td className="p-4">Manual installation: terminal commands, API configuration, dependency management</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-medium text-white">Hardware Requirements</td>
                  <td className="p-4 bg-zinc-950">Zero, fully cloud-hosted</td>
                  <td className="p-4">Requires always-on machine or VPS</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-medium text-white">Skills Access</td>
                  <td className="p-4 bg-zinc-950">Instant access to pre-built skills, no manual installation</td>
                  <td className="p-4">Install skills one by one from ClawHub</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-medium text-white">Uptime</td>
                  <td className="p-4 bg-zinc-950">24/7 Always-online in the cloud</td>
                  <td className="p-4">Only runs when your computer is on</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-medium text-white">Storage</td>
                  <td className="p-4 bg-zinc-950">10GB free, 50GB pro</td>
                  <td className="p-4">Limited by local disk space</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-medium text-white">Channels</td>
                  <td className="p-4 bg-zinc-950">Telegram, Discord, WhatsApp</td>
                  <td className="p-4">Manual integration required</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-medium text-white">Cost</td>
                  <td className="p-4 bg-zinc-950">{PRICE_START} Underground plan</td>
                  <td className="p-4">VPS costs or dedicated hardware needed for 24/7 use</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <Link href="/signup" className="inline-block bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200">
              Try Agentbot
            </Link>
          </div>
        </section>

        <section id="features" className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Features</span>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-6">Features that actually matter</h2>
          <p className="text-sm text-zinc-400 mb-8">
            Agentbot combines OpenClaw&apos;s intelligent agent capabilities with cloud infrastructure and instant skill access. Here&apos;s what you can do with it:
          </p>

          <div className="space-y-8">
            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Persistent memory & custom personality</h3>
              <p className="text-sm text-zinc-400">
                Agentbot remembers your preferences, work style, and past conversations across sessions. You can also customize its persona—give it a name, set its tone, and define how it responds. Tell it once to &quot;always format reports with three bullet points and one risk note,&quot; and it applies that rule automatically. This transforms a generic chatbot into a personalized assistant that adapts to how you work.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Proactive scheduled tasks</h3>
              <p className="text-sm text-zinc-400">
                Unlike tools that only respond when prompted, Agentbot can run tasks on a schedule you set. Want market news summarized every morning at 9 AM? A weekly report generated every Friday? Daily reminders at specific times? Set the timing, output format, and constraints once, and Agentbot executes automatically—no manual triggers needed.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Ready-to-use skills at your fingertips</h3>
              <p className="text-sm text-zinc-400">
                Agentbot includes pre-built skills for web search, data analysis, image processing, coding assistance, and more. You don&apos;t need to install skills one by one. You can call and chain them instantly within the chat interface. Need to analyze a CSV file, generate charts, and export a PDF? Just describe the workflow, and Agentbot calls the right skills automatically.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Cloud storage included</h3>
              <p className="text-sm text-zinc-400">
                Agentbot provides 10GB free (50GB pro) of cloud storage for your files, reports, and outputs. Your agent can save documents, retrieve past work, and maintain file version history—all accessible from any device. No need to manage local folders or worry about losing files when switching machines.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Kimi K2.5 Thinking model</h3>
              <p className="text-sm text-zinc-400">
                Agentbot uses Kimi&apos;s advanced K2.5 Thinking model with 128K context window. It provides advanced reasoning capabilities for complex tasks, financial analysis, competitive research, and real-time data tracking with higher accuracy than generic models.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Multi-channel deployment</h3>
              <p className="text-sm text-zinc-400">
                Unlike web-only solutions, Agentbot deploys to Telegram, Discord, and WhatsApp. Chat with your agent wherever you work. One agent, accessible everywhere, with the same memory and capabilities across all channels.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Coinbase Agentic Wallet</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Agentbot integrates with <a href="https://docs.cdp.coinbase.com/agentic-wallet/welcome" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Coinbase Agentic Wallet</a>, enabling your agent to execute onchain transactions autonomously. Send payments, interact with smart contracts, and manage crypto assets—all through natural language commands.
              </p>
              <p className="text-sm text-zinc-400">
                Your agent can handle DeFi operations, NFT minting, token swaps, and more, making it a true autonomous financial assistant.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">Deploy from Marketplace</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Don&apos;t want to build from scratch? Browse our <Link href="/marketplace" className="text-blue-500 hover:underline">marketplace</Link> of pre-configured agents. Each template comes with personality, skills, and use-case-specific configurations ready to go.
              </p>
              <p className="text-sm text-zinc-400 mb-3">
                <strong className="text-white">Popular templates:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1 mb-3">
                <li><strong>basefmbot</strong> — Onchain Radio Agent for underground communities (by <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">raveculture</a>)</li>
                <li><strong>cafe</strong> — Startup Cafe Agent for customer service</li>
                <li><strong>studio-one</strong> — Dancehall Dub Agent with London roots culture</li>
                <li><strong>chain</strong> — Crypto Agent with wallet capabilities (USDC, swaps, Base)</li>
                <li><strong>vault</strong> — DeFi Agent for yield farming and staking</li>
                <li><strong>pay</strong> — Commerce Agent for crypto payments</li>
              </ul>
              <p className="text-sm text-zinc-400">
                Choose a template, customize it to your needs, and deploy in one click.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/signup" className="inline-block bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200">
              Get Started
            </Link>
          </div>
        </section>

        <section id="how-to" className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Guide</span>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-6">How to use Agentbot?</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Step 1: Create or link your OpenClaw</h3>
              <p className="text-sm text-zinc-400 mb-4">
                You have three ways to get started with Agentbot:
              </p>
              <ul className="list-disc list-inside text-sm text-zinc-400 mb-4 space-y-2">
                <li><strong className="text-white">Create from scratch:</strong> Deploy a fresh OpenClaw instance with custom configuration</li>
                <li><strong className="text-white">Link existing:</strong> Connect your local OpenClaw to Agentbot&apos;s cloud infrastructure</li>
                <li><strong className="text-white">Deploy from marketplace:</strong> Choose a pre-configured agent template and deploy instantly</li>
              </ul>
              <p className="text-sm text-zinc-400 mb-4">
                Visit the <Link href="/onboard" className="text-blue-500 hover:underline">onboard page</Link> or browse the <Link href="/marketplace" className="text-blue-500 hover:underline">marketplace</Link> to get started. Deployment takes about one minute and automatically configures the K2.5 Thinking model.
              </p>
              <div className="border border-zinc-800 bg-black p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <Link href="/onboard?mode=create" className="flex-1 bg-white text-black py-3 text-center text-xs font-bold uppercase tracking-widest hover:bg-zinc-200">
                    Create New
                  </Link>
                  <Link href="/onboard?mode=link" className="flex-1 border border-zinc-700 py-3 text-center text-xs font-bold uppercase tracking-widest hover:border-zinc-500 text-white">
                    Link Existing
                  </Link>
                  <Link href="/marketplace" className="flex-1 border border-zinc-700 py-3 text-center text-xs font-bold uppercase tracking-widest hover:border-zinc-500 text-white">
                    Browse Marketplace
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Step 2: Customize your AI assistant&apos;s personality</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Agentbot&apos;s behavior isn&apos;t fixed. You can set its name, role, speaking style, and output format with a single instruction. Adjust its tone from formal to casual, make responses shorter or more detailed, or add standard opening and closing phrases.
              </p>
              <div className="border border-zinc-800 bg-black p-5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Example customization:</span>
                <p className="text-sm text-zinc-400 italic">&quot;You are a professional business analyst. Always format reports with three bullet points and one risk note. Use a formal tone and end messages with &apos;Best regards, Your AI Assistant.&apos;&quot;</p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Step 3: Use skills</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Agentbot includes pre-built skills covering data analysis, web search, image processing, coding, and more. Instead of installing skills manually, simply ask Agentbot to identify and use the most relevant ones for your task. You can also chain multiple skills together within a single workflow.
              </p>
              <div className="border border-zinc-800 bg-black p-5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Example prompts:</span>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>&mdash; &quot;Analyze current stock market opportunities and generate insights.&quot;</li>
                  <li>&mdash; &quot;Conduct a competitor analysis and ask me for required information step by step.&quot;</li>
                  <li>&mdash; &quot;Parse this CSV file, create visualizations, and export a PDF report.&quot;</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Step 4: Set up scheduled tasks</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Agentbot can run tasks automatically on a schedule. To configure this reliably, specify three elements: when to run (time or frequency), what to do (task description), and how to deliver the result (output format and constraints).
              </p>
              <div className="border border-zinc-800 bg-black p-5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Template:</span>
                <p className="text-sm text-zinc-400 mb-4 italic">At [time], do [task], output [format], and follow [constraints].</p>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Example prompts:</span>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>&mdash; &quot;Every Friday at 5 PM, generate a weekly report using the template I shared earlier.&quot;</li>
                  <li>&mdash; &quot;Every morning at 8:30, find the top 5 AI news stories and summarize them.&quot;</li>
                  <li>&mdash; &quot;Remind me in one hour to shut down my computer. Use a gentle tone.&quot;</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Use Cases</span>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-6">Real-world use cases</h2>
          <p className="text-sm text-zinc-400 mb-8">
            Agentbot handles workflows across content creation, data analysis, automation, and marketing. Below are four practical scenarios showing how different users apply it to save time and reduce manual work.
          </p>

          <div className="space-y-6">
            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">1. 24/7 Personal Information Radar</h3>
              <p className="text-sm text-zinc-400 mb-3">
                <strong className="text-white">Scenario:</strong> You want to stay updated on a specific industry (like AI or Finance) without manual searching. You need the AI to fetch news daily, summarize the most impactful trends, and archive a weekly report for long-term tracking.
              </p>
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Example prompt:</span>
                <p className="text-zinc-400 italic text-sm">
                  &quot;Every morning at 8:30, use Web Search to find the top 5 most significant news stories about AI Agent developments. Summarize each into 2 concise bullets, and save these daily briefs into my cloud folder &apos;AI Trends.&apos; At the end of each week, compile all briefs into a one-page executive summary PDF.&quot;
                </p>
              </div>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">2. Content creation</h3>
              <p className="text-sm text-zinc-400 mb-3">
                <strong className="text-white">Scenario:</strong> You want to develop a professional whitepaper from a simple topic, ensure it is polished, and keep it organized in your cloud workspace.
              </p>
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Example prompt:</span>
                <p className="text-sm text-zinc-400 italic">
                  &quot;Draft a comprehensive whitepaper on &apos;The Future of Remote Work in 2026.&apos; Once finished, proofread it for clarity, add a risk analysis section, and save the final Markdown file to my &apos;Professional Reports&apos; folder.&quot;
                </p>
              </div>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">3. Intelligent data visualization</h3>
              <p className="text-sm text-zinc-400 mb-3">
                <strong className="text-white">Scenario:</strong> You have raw data that needs professional interpretation, visual charts for a presentation, and an archived PDF for sharing.
              </p>
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Example prompt:</span>
                <p className="text-sm text-zinc-400 italic">
                  &quot;Examine my &apos;marketing_performance.csv&apos; file to identify the highest-performing channels. Generate a pie chart for budget distribution and a line graph for ROI trends, then compile everything into a PDF report and save it to cloud storage.&quot;
                </p>
              </div>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-3">5. Onchain community management</h3>
              <p className="text-sm text-zinc-400 mb-3">
                <strong className="text-white">Scenario:</strong> You&apos;re building an underground music community and need an agent that understands the culture, grows engagement organically, and bridges humans with AI agents onchain.
              </p>
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Example: Deploy basefmbot template</span>
                <p className="text-sm text-zinc-400 mb-3">
                  The <strong className="text-white">basefmbot</strong> template (by <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">raveculture</a>) comes pre-configured with deep knowledge of basefm.space, underground radio culture, and onchain community building. It knows how to:
                </p>
                <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                  <li>Grow communities organically without spam</li>
                  <li>Bridge human and AI agent networks</li>
                  <li>Understand underground music culture</li>
                  <li>Facilitate onchain radio interactions</li>
                  <li>Build authentic engagement</li>
                </ul>
                <p className="text-sm text-zinc-400 mt-3">
                  Deploy from <Link href="/marketplace" className="text-blue-500 hover:underline">marketplace</Link>, customize the personality, and let it run 24/7 across Telegram, Discord, and WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="conclusion" className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Conclusion</span>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-6">Conclusion</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Agentbot represents the future of AI agents by combining the personality and memory of OpenClaw with cloud infrastructure and multi-channel deployment. By eliminating hardware barriers and complex terminal setups, it allows you to maintain a professional-grade assistant that is online 24/7 and ready to handle specialized tasks across Telegram, Discord, and WhatsApp.
          </p>
          <p className="text-sm text-zinc-400 mb-8">
            Whether you are automating daily research or managing long-term projects, Agentbot provides the reliable, always-on brain you need to stay ahead.
          </p>

          <div className="border border-zinc-800 bg-black p-8">
            <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Ready to deploy your AI agent?</h3>
            <p className="text-sm text-zinc-400 mb-6">Start from {PRICE_START} with full access.</p>
            <Link href="/signup" className="inline-block bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200">
              Get Started
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">FAQ</span>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-6">Questions & Answers</h2>
          
          <div className="space-y-6">
            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-2">Is Agentbot free?</h3>
              <p className="text-sm text-zinc-400">
                Plans start at {PRICE_START} for the Underground plan. One-click cloud deployment is available on all paid plans. If you already run OpenClaw locally, you can link it to Agentbot for free. See our <Link href="/pricing" className="text-blue-500 hover:underline">pricing page</Link> for details.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-2">Can I use the terminal to control Agentbot?</h3>
              <p className="text-sm text-zinc-400">
                Agentbot does not currently support direct terminal access. A terminal UI is coming soon. For now, you can send commands via chat (Telegram, Discord, WhatsApp) and let Agentbot execute them for you.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-2">What if Agentbot doesn&apos;t respond to messages?</h3>
              <p className="text-sm text-zinc-400">
                First, try refreshing your chat or reconnecting. If that doesn&apos;t work, go to your <Link href="/dashboard" className="text-blue-500 hover:underline">Dashboard</Link> and click &quot;Restart Agent.&quot; Wait for it to restart, then message again. If neither solution works, contact support from the dashboard.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-2">Can Agentbot send files back to me?</h3>
              <p className="text-sm text-zinc-400">
                Yes! Agentbot can send files directly through Telegram, Discord, and WhatsApp. You can also access generated files through the cloud storage dashboard. Files are saved automatically and accessible from any device.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-2">Can Agentbot handle crypto transactions?</h3>
              <p className="text-sm text-zinc-400">
                Yes! Agentbot integrates with <a href="https://docs.cdp.coinbase.com/agentic-wallet/welcome" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Coinbase Agentic Wallet</a>, enabling your agent to execute onchain transactions autonomously. Your agent can send payments, interact with smart contracts, swap tokens, mint NFTs, and manage crypto assets through natural language commands. This makes it a true autonomous financial assistant for DeFi operations.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-2">Can I deploy a pre-configured agent?</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Absolutely! Visit our <Link href="/marketplace" className="text-blue-500 hover:underline">marketplace</Link> to browse pre-configured agent templates. Each template comes with personality, skills, and use-case-specific configurations.
              </p>
              <p className="text-sm text-zinc-400 mb-3">
                <strong className="text-white">Available templates include:</strong>
              </p>
              <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
                <li><strong className="text-white">basefmbot</strong> — Onchain Radio Agent (by raveculture) for underground communities</li>
                <li><strong className="text-white">cafe</strong> — Customer service agent for startups</li>
                <li><strong className="text-white">studio-one</strong> — Dancehall Dub Agent with London roots culture</li>
                <li><strong className="text-white">agentbotdj</strong> — Underground DJ Agent for crate digging</li>
                <li><strong className="text-white">chain</strong> — Crypto Agent with wallet (USDC, swaps on Base)</li>
                <li><strong className="text-white">vault</strong> — DeFi Agent for yield farming and staking</li>
                <li><strong className="text-white">pay</strong> — Commerce Agent for crypto payments and subscriptions</li>
              </ul>
              <p className="text-sm text-zinc-400 mt-3">
                Choose one, customize it to your needs, and deploy in one click. No need to build from scratch.
              </p>
            </div>

            <div className="border border-zinc-800 bg-black p-5">
              <h3 className="text-sm font-bold uppercase tracking-tighter mb-2">What is Agentbot?</h3>
              <p className="text-sm text-zinc-400">
                Agentbot is a cloud-based AI assistant platform that deploys OpenClaw to the cloud in one click. You get a 24/7 personal AI assistant with long-term memory, customizable personality, ready-to-use skills, and multi-channel access (Telegram, Discord, WhatsApp)—all without server setup or terminal commands.
              </p>
            </div>
          </div>
        </section>

        <div className="text-left py-12 border-t border-zinc-800">
          <Link href="/onboard" className="inline-block bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200">
            Deploy Your Agent Now
          </Link>
        </div>
      </div>
    </main>
  )
}
