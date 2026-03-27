import Link from 'next/link';

export default function CreditPricingPost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">February 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Introducing Credit-Based Pricing</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Feature</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Pricing</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6">
 Pay only for what you use with our new flexible credit system.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">How It Works</h2>
 <p className="text-zinc-300 mb-4">
 Buy credits upfront and use them across any AI model. No subscriptions, no surprises.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Transparent Pricing</h2>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>$10 = 1,000 credits</li>
 <li>GPT-4o: 1 credit per message</li>
 <li>Claude 3.5: 1 credit per message</li>
 <li>Groq Llama: 0.1 credits per message</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">No Hidden Fees</h2>
 <p className="text-zinc-300 mb-4">
 Infrastructure costs are included. You only pay for AI model usage. Credits never expire.
 </p>

 <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
 <p className="text-zinc-300 mb-4">Start with $10 in free credits</p>
 <Link href="/signup" className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors">
 Get Started
 </Link>
 </div>
 </article>
 </div>
 </main>
 );
}
