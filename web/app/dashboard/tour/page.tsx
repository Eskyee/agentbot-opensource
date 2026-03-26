'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Map, Plus, Calendar, ExternalLink } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'

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

const STATUS_MAP = {
  confirmed: 'active' as const,
  pending: 'idle' as const,
  cancelled: 'error' as const,
}

export default function TourManagementPage() {
  const [tourDates, setTourDates] = useState(mockTourDates)
  const [showAddForm, setShowAddForm] = useState(false)

  const confirmedDates = tourDates.filter(d => d.status === 'confirmed')
  const pendingDates = tourDates.filter(d => d.status === 'pending')
  const totalRevenue = confirmedDates.reduce((acc, d) => acc + parseFloat(d.fee.replace('$', '')), 0)
  const totalTickets = confirmedDates.reduce((acc, d) => acc + d.ticketsSold, 0)

  return (
    <DashboardShell>
      <DashboardHeader
        title="Tour Management"
        icon={<Calendar className="h-5 w-5 text-blue-400" />}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-4"
            >
              + Add Date
            </button>
            <Link href="/dashboard/venue-finder" className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4">
              Find Venues
            </Link>
          </div>
        }
      />

      <DashboardContent className="space-y-6">
        <p className="text-xs text-zinc-500">
          Manage your upcoming tour dates and bookings.
        </p>

        {/* Overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Confirmed Shows</div>
            <div className="text-2xl font-mono font-bold text-green-400">{confirmedDates.length}</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Pending</div>
            <div className="text-2xl font-mono font-bold text-yellow-400">{pendingDates.length}</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Total Revenue</div>
            <div className="text-2xl font-mono font-bold text-green-400">${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Tickets Sold</div>
            <div className="text-2xl font-mono font-bold text-blue-400">{totalTickets.toLocaleString()}</div>
          </div>
        </div>

        {/* Tour Dates */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Tour Schedule</h2>
          <div className="space-y-px bg-zinc-800">
            {tourDates.map(td => (
              <div key={td.id} className="bg-zinc-950 border border-zinc-800 flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-left min-w-[60px]">
                    <div className="text-lg font-mono font-bold">{new Date(td.date).getDate()}</div>
                    <div className="text-[10px] text-zinc-600 uppercase tracking-widest">{new Date(td.date).toLocaleDateString('en', { month: 'short' })}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-tight">{td.venue}</div>
                    <div className="text-xs text-zinc-500">{td.city}, {td.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-mono text-zinc-300">{td.fee}</div>
                    {td.ticketsSold > 0 && (
                      <div className="text-[10px] text-zinc-600">{td.ticketsSold}/{td.capacity} tickets</div>
                    )}
                  </div>
                  <StatusPill status={STATUS_MAP[td.status]} label={td.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="border border-zinc-800 bg-zinc-950 p-8 text-left">
          <Map className="h-6 w-6 text-zinc-600 mb-3" />
          <h3 className="text-sm font-bold uppercase tracking-tight mb-2">Tour Map</h3>
          <p className="text-xs text-zinc-500">Interactive tour route visualization coming soon</p>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
