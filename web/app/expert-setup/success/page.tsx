import { Calendar, CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default async function ExpertSetupSuccess({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string }>
}) {
  const params = await searchParams
  const date = params.date || ''
  const time = params.time || ''

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold tracking-tighter uppercase mb-4">
          Booking Confirmed!
        </h1>

        <p className="text-zinc-400 mb-8">
          Your expert setup session has been booked. We'll send a confirmation email with the meeting link shortly.
        </p>

        {date && time && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-zinc-500" />
              <span className="font-bold">{date} at {time}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-zinc-500 mb-8">
          <Mail className="w-4 h-4" />
          <span className="text-sm">Check your email for the Google Meet link</span>
        </div>

        <Link
          href="/dashboard"
          className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-zinc-200"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}