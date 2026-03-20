'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TourDate {
  id: string
  date: string
  venue: string
  city: string
  country: string
  status: 'confirmed' | 'pending' | 'cancelled'
  fee: string
  ticketsSold: number
  capacity: number
}

const mockTourDates: TourDate[] = [
  { id: '1', date: '2026-04-12', venue: 'Corsica Studios', city: 'London', country: 'UK', status: 'confirmed', fee: '$500', ticketsSold: 280, capacity: 350 },
  { id: '2', date: '2026-04-19', venue: 'Rex Club', city: 'Paris', country: 'FR', status: 'confirmed', fee: '$400', ticketsSold: 320, capacity: 500 },
  { id: '3', date: '2026-04-26', venue: 'Shelter', city: 'Amsterdam', country: 'NL', status: 'pending', fee: '$450', ticketsSold: 0, capacity: 700 },
  { id: '4', date: '2026-05-03', venue: 'Tresor', city: 'Berlin', country: 'DE', status: 'pending', fee: '$600', ticketsSold: 0, capacity: 600 },
  { id: '5', date: '2026-05-17', venue: 'Womb', city: 'Tokyo', country: 'JP', status: 'pending', fee: '$800', ticketsSold: 0, capacity: 500 },
]

export default function TourManagementPage() {
  const [tourDates, setTourDates] = useState(mockTourDates)
  const [showAddForm, setShowAddForm] = useState(false)

  const confirmedDates = tourDates.filter(d => d.status === 'confirmed')
  const pendingDates = tourDates.filter(d => d.status === 'pending')
  const totalRevenue = confirmedDates.reduce((acc, d) => acc + parseFloat(d.fee.replace('$', '')), 0)
  const totalTickets = confirmedDates.reduce((acc, d) => acc + d.ticketsSold, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-900/50 text-green-400'
      case 'pending': return 'bg-yellow-900/50 text-yellow-400'
      case 'cancelled': return 'bg-red-900/50 text-red-400'
      default: return 'bg-zinc-800 text-zinc-400'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Tour Management</h1>
              <p className="text-zinc-400 text-sm mt-1">Manage your upcoming tour dates and bookings</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200"
              >
                + Add Date
              </button>
              <Link href="/dashboard/venue-finder" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm">
                Find Venues
              </Link>
              <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">Dashboard</Link>
            </div>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Confirmed Shows</div>
              <div className="text-2xl font-bold text-green-400">{confirmedDates.length}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-400">{pendingDates.length}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Tickets Sold</div>
              <div className="text-2xl font-bold text-blue-400">{totalTickets.toLocaleString()}</div>
            </div>
          </div>

          {/* Tour Dates */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="font-semibold">Tour Schedule</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {tourDates.map(td => (
                <div key={td.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold">{new Date(td.date).getDate()}</div>
                      <div className="text-xs text-zinc-500">{new Date(td.date).toLocaleDateString('en', { month: 'short' })}</div>
                    </div>
                    <div>
                      <div className="font-semibold">{td.venue}</div>
                      <div className="text-sm text-zinc-400">{td.city}, {td.country}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-mono">{td.fee}</div>
                      {td.ticketsSold > 0 && (
                        <div className="text-xs text-zinc-500">{td.ticketsSold}/{td.capacity} tickets</div>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusColor(td.status)}`}>
                      {td.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="mt-8 bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="text-lg font-bold mb-2">Tour Map</h3>
            <p className="text-zinc-400 text-sm">Interactive tour route visualization coming soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
