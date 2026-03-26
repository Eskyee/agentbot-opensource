'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Venue {
  id: string
  name: string
  city: string
  country: string
  capacity: number
  type: string
  priceRange: string
  rating: number
  available: boolean
}

const mockVenues: Venue[] = [
  { id: '1', name: 'Fabric', city: 'London', country: 'UK', capacity: 1600, type: 'Club', priceRange: '$$$$', rating: 4.8, available: true },
  { id: '2', name: 'Berghain', city: 'Berlin', country: 'DE', capacity: 1500, type: 'Club', priceRange: '$$$', rating: 4.9, available: false },
  { id: '3', name: 'Warehouse Project', city: 'Manchester', country: 'UK', capacity: 3000, type: 'Warehouse', priceRange: '$$$', rating: 4.6, available: true },
  { id: '4', name: 'Rex Club', city: 'Paris', country: 'FR', capacity: 500, type: 'Club', priceRange: '$$', rating: 4.4, available: true },
  { id: '5', name: 'De School', city: 'Amsterdam', country: 'NL', capacity: 700, type: 'Club', priceRange: '$$$', rating: 4.7, available: true },
  { id: '6', name: 'Tresor', city: 'Berlin', country: 'DE', capacity: 600, type: 'Club', priceRange: '$$', rating: 4.5, available: true },
  { id: '7', name: 'Ministry of Sound', city: 'London', country: 'UK', capacity: 1500, type: 'Club', priceRange: '$$$$', rating: 4.3, available: false },
  { id: '8', name: 'Shelter', city: 'Amsterdam', country: 'NL', capacity: 700, type: 'Club', priceRange: '$$', rating: 4.6, available: true },
  { id: '9', name: 'Output', city: 'Brooklyn', country: 'US', capacity: 500, type: 'Club', priceRange: '$$$', rating: 4.5, available: true },
  { id: '10', name: 'Movement Festival', city: 'Detroit', country: 'US', capacity: 30000, type: 'Festival', priceRange: '$$$$', rating: 4.7, available: true },
  { id: '11', name: 'Womb', city: 'Tokyo', country: 'JP', capacity: 500, type: 'Club', priceRange: '$$$', rating: 4.6, available: true },
  { id: '12', name: 'Corsica Studios', city: 'London', country: 'UK', capacity: 350, type: 'Club', priceRange: '$$', rating: 4.4, available: true },
]

export default function VenueFinderPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [capacityFilter, setCapacityFilter] = useState<string>('all')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  const filtered = mockVenues.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.city.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && v.type !== typeFilter) return false
    if (capacityFilter === 'small' && v.capacity > 500) return false
    if (capacityFilter === 'medium' && (v.capacity <= 500 || v.capacity > 1500)) return false
    if (capacityFilter === 'large' && v.capacity <= 1500) return false
    if (showAvailableOnly && !v.available) return false
    return true
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Venue Finder</h1>
              <p className="text-zinc-400 text-sm mt-1">Find and book venues worldwide</p>
            </div>
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">Back to Dashboard</Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              placeholder="Search venues or cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-white"
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm">
              <option value="all">All Types</option>
              <option value="Club">Club</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Festival">Festival</option>
            </select>
            <select value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm">
              <option value="all">Any Capacity</option>
              <option value="small">Small (&lt;500)</option>
              <option value="medium">Medium (500-1500)</option>
              <option value="large">Large (1500+)</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={showAvailableOnly} onChange={(e) => setShowAvailableOnly(e.target.checked)} className="rounded" />
              Available only
            </label>
          </div>

          {/* Results */}
          <div className="grid gap-4 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(venue => (
              <div key={venue.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{venue.name}</h3>
                    <p className="text-sm text-zinc-400">{venue.city}, {venue.country}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${venue.available ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {venue.available ? 'Available' : 'Booked'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-xs text-zinc-500">Capacity</div>
                    <div className="font-mono">{venue.capacity.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Type</div>
                    <div>{venue.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Price</div>
                    <div>{venue.priceRange}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-sm">{'★'.repeat(Math.floor(venue.rating))}</span>
                    <span className="text-xs text-zinc-500">{venue.rating}</span>
                  </div>
                  <button
                    disabled={!venue.available}
                    className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Request Booking
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-left py-12 text-zinc-500">No venues match your filters</div>
          )}
        </div>
      </main>
    </div>
  )
}
