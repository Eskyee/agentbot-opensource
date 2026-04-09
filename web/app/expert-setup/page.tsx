'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Video, CheckCircle, Loader2 } from 'lucide-react'

const slots = [
  { day: 'Mon', date: 'Apr 14', times: ['10:00', '14:00', '16:00'] },
  { day: 'Tue', date: 'Apr 15', times: ['10:00', '14:00', '16:00'] },
  { day: 'Wed', date: 'Apr 16', times: ['10:00', '14:00', '16:00'] },
  { day: 'Thu', date: 'Apr 17', times: ['10:00', '14:00', '16:00'] },
  { day: 'Fri', date: 'Apr 18', times: ['10:00', '14:00', '16:00'] },
]

const features = [
  'Live screen share setup',
  'Custom agent configuration',
  'Integration guidance (Telegram, Discord, WhatsApp)',
  'AI model selection advice',
  'Workflow optimization tips',
  'Q&A for your specific use case',
]

export default function ExpertSetupPage() {
  const [selectedSlot, setSelectedSlot] = useState<{date: string; time: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleBook = async () => {
    if (!selectedSlot || !email) return
    setLoading(true)
    
    try {
      const res = await fetch(`/api/stripe/expert-setup-checkout?date=${selectedSlot.date}&time=${selectedSlot.time}&email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to create checkout. Please try again.')
      }
    } catch (err) {
      alert('Error booking session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Expert Setup</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">
            1-Hour Live<br /><span className="text-zinc-700">Configuration</span>
          </h1>
          <p className="text-zinc-400 mt-6 max-w-lg mx-auto">
            Get your agent configured live with our team. Screen share, custom setup, real answers.
          </p>
        </div>

        {/* Price Tag */}
        <div className="text-center mb-12">
          <div className="inline-flex items-baseline gap-1">
            <span className="text-5xl font-bold">£49</span>
            <span className="text-zinc-500">/ session</span>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-zinc-900 rounded-2xl p-8 mb-12">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6">What's Included</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="border border-zinc-800 rounded-2xl p-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select a Time Slot
          </h3>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {slots.map((slot) => (
              <div key={slot.date} className="text-center">
                <div className="text-[10px] uppercase text-zinc-500 mb-1">{slot.day}</div>
                <div className="text-xs font-bold mb-2">{slot.date}</div>
                <div className="space-y-1">
                  {slot.times.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedSlot({ date: slot.date, time })}
                      className={`block w-full text-xs py-2 rounded transition-colors ${
                        selectedSlot?.date === slot.date && selectedSlot?.time === time
                          ? 'bg-white text-black font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">
              Your Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Book Button */}
          <Button
            onClick={handleBook}
            disabled={!selectedSlot || !email || loading}
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : selectedSlot ? (
              <>Book {selectedSlot.date} at {selectedSlot.time} — £49</>
            ) : (
              'Select a time slot'
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-zinc-500">
            <Video className="w-4 h-4" />
            <span>Video call via Google Meet</span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <a href="/pricing" className="text-zinc-500 hover:text-zinc-300 text-sm">
            ← Back to pricing
          </a>
        </div>
      </div>
    </main>
  )
}