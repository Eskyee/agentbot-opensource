'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PartnerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', company: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16 space-y-6 max-w-2xl">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Partnership Program</span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none">
            Partner <br />
            <span className="text-zinc-700">With Us</span>
          </h1>

          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Build together. Win together.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column — Info */}
          <div className="space-y-12">
            {/* What We're Looking For */}
            <section className="border-t border-zinc-800 pt-8">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-6">What We&apos;re Looking For</span>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">AI Model Providers</strong> — Want your model on our platform?</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Tool & API Integrations</strong> — Connect your service to our agents</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Resellers & Agencies</strong> — Offer Agentbot to your clients</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Content Creators</strong> — Tutorials, guides, demos</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Developer Advocates</strong> — Build open-source agent templates</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Infrastructure Partners</strong> — Discord/Telegram/Social platforms</span>
                </li>
              </ul>
            </section>

            {/* What We Bring */}
            <section className="border-t border-zinc-800 pt-8">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-6">What We Bring</span>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Live Traffic</strong> — Our agents serve real users 24/7</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Distribution</strong> — Access to our user base</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Revenue Share</strong> — Partner pricing on Agentbot plans</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">API Access</strong> — Programmatic access to our platform</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Co-marketing</strong> — Blog posts, demos, case studies</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-zinc-600">&mdash;</span>
                  <span className="text-zinc-400"><strong className="text-white">Direct Access</strong> — Work directly with the builders</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Right Column — Form */}
          <div>
            <section className="border-t border-zinc-800 pt-8 lg:border-t-0 lg:pt-0">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-6">Get In Touch</span>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Tell us who you are, what you&apos;re building, and what value you could bring.
              </p>

              {status === 'success' ? (
                <div className="border border-zinc-800 bg-black p-5">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Received</span>
                  <p className="text-white text-sm">Thanks! We&apos;ll be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Company (optional)</label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      placeholder="Your company"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Message</label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                      placeholder="Tell us about what you're building and how we could partner..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-400 transition-colors"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                  {status === 'error' && (
                    <p className="text-red-400 text-xs uppercase tracking-widest">Something went wrong. Please try again.</p>
                  )}
                </form>
              )}
            </section>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-16 border-t border-zinc-800 pt-8">
          <Link
            href="/"
            className="border border-zinc-700 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors inline-block"
          >
            Back to Agentbot
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-32 pt-12 border-t border-zinc-800 flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            Agentbot Partnership
          </div>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/token" className="hover:text-white transition-colors">Token</Link>
            <Link href="/agents" className="hover:text-white transition-colors">Agent Builder</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
