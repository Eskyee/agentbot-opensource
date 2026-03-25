'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'

function CalendarPageContent() {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setConnected(true)
    }
  }, [searchParams])

  const connectCalendar = async () => {
    setLoading(true)
    try {
      // No userId needed — API uses session auth
      const res = await fetch('/api/calendar?action=connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      })
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
      // No userId in URL — API derives from session
      const res = await fetch(`/api/calendar?action=list&start=${start}&end=${end}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [currentDate])

  useEffect(() => {
    if (connected) {
      fetchEvents()
    }
  }, [connected, currentDate, fetchEvents])

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e: any) => {
      const start = e.start?.dateTime || e.start?.date || ''
      return start.startsWith(dateStr)
    })
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-6 py-6">
            <Breadcrumbs />
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Google Calendar</span>
                <h1 className="text-3xl font-bold tracking-tighter uppercase mt-1">Calendar</h1>
              </div>
            {!connected ? (
              <button
                onClick={connectCalendar}
                disabled={loading}
                className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect Google Calendar'}
              </button>
            ) : (
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            )}
          </div>

          {connected ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg">←</button>
                <h2 className="text-xl font-bold uppercase tracking-tighter">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg">→</button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-left text-zinc-400 py-2 text-xs uppercase tracking-widest">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 bg-zinc-900/50 rounded-lg" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = getEventsForDay(day)
                  const isToday = new Date().getDate() === day && 
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear()
                  
                  return (
                    <div 
                      key={day} 
                      className={`h-24 bg-zinc-900 rounded-lg p-2 ${isToday ? 'border border-white' : ''}`}
                    >
                      <div className={`text-sm ${isToday ? 'text-white font-bold' : 'text-zinc-400'}`}>{day}</div>
                      {dayEvents.slice(0, 2).map((event: any, idx: number) => (
                        <div key={idx} className="text-xs bg-blue-900/50 text-blue-200 truncate rounded px-1 mt-1">
                          {event.summary}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-zinc-500 mt-1">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 uppercase tracking-tighter">Upcoming Events</h3>
                <div className="space-y-2">
                  {events.slice(0, 5).map((event: any) => (
                    <div key={event.id} className="bg-zinc-900 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{event.summary}</div>
                        <div className="text-sm text-zinc-400">
                          {new Date(event.start?.dateTime || event.start?.date).toLocaleString()}
                        </div>
                      </div>
                      {event.location && (
                        <div className="text-sm text-zinc-500">{event.location}</div>
                      )}
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-zinc-500 py-8">No upcoming events</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16">
              <div className="text-6xl mb-4">📆</div>
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter">Connect Your Calendar</h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-md">
                Sync with Google Calendar to schedule events, manage availability, and let your agent handle bookings automatically.
              </p>
              <button
                onClick={connectCalendar}
                className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-zinc-200"
              >
                Connect Google Calendar
              </button>
            </div>
          )}
        </div>
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <CalendarPageContent />
    </Suspense>
  )
}
