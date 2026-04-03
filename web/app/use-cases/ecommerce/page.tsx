import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'E-Commerce — Agentbot Use Cases',
  description: 'Handle customer inquiries, order tracking, product recommendations, and booking management around the clock.',
}

export default function EcommercePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero label="Use Case" title="E-" highlight="Commerce" description="Handle customer inquiries, order tracking, product recommendations, and booking management around the clock." gradient="amber" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">What It Does</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Customer Support', desc: 'Answer product questions, handle returns, and resolve issues on WhatsApp and Telegram.' },
            { title: 'Order Tracking', desc: 'Push real-time shipping updates and delivery confirmations to customers.' },
            { title: 'Product Recs', desc: 'Suggest products based on browsing history and past purchases.' },
            { title: 'Booking Management', desc: 'Handle appointment scheduling, reminders, and calendar sync.' },
            { title: 'Review Collection', desc: 'Auto-request reviews after delivery, respond to negative feedback.' },
            { title: 'Inventory Alerts', desc: 'Notify team when stock runs low, auto-reorder from suppliers.' },
          ].map((f) => (
            <div key={f.title} className="border border-zinc-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link href="/onboard?plan=solo" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Deploy Your Agent</Link>
          <Link href="/use-cases" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">← All Use Cases</Link>
        </div>
      </div>
    </main>
  )
}
