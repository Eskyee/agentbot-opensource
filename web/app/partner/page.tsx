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
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Partner With Us
        </h1>
        <p className="text-xl text-gray-400 mb-10">
          Build together. Win together.
        </p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What We're Looking For</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>AI Model Providers</strong> - Want your model on our platform?</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Tool & API Integrations</strong> - Connect your service to our agents</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Resellers & Agencies</strong> - Offer Agentbot to your clients</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Content Creators</strong> - Tutorials, guides, demos</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Developer Advocates</strong> - Build open-source agent templates</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Infrastructure Partners</strong> - Discord/Telegram/Social platforms</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What We Bring</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Live Traffic</strong> - Our agents serve real users 24/7</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Distribution</strong> - Access to our user base</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Revenue Share</strong> - Partner pricing on Agentbot plans</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>API Access</strong> - Programmatic access to our platform</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Co-marketing</strong> - Blog posts, demos, case studies</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">→</span>
              <span><strong>Direct Access</strong> - Work directly with the builders</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-green-500/30 p-6">
          <h2 className="text-xl font-semibold mb-4">Get In Touch</h2>
          <p className="text-gray-400 mb-6">
            Tell us who you are, what you're building, and what value you could bring.
          </p>

          {status === 'success' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
              Thanks! We'll be in touch soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm text-gray-400 mb-1">Company (optional)</label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="Your company"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm text-gray-400 mb-1">Message</label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="Tell us about what you're building and how we could partner..."
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-black font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
              {status === 'error' && (
                <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
              )}
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← Back to Agentbot
          </Link>
        </div>
      </div>
    </main>
  );
}