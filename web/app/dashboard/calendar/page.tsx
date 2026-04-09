'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'

function CalendarPageContent() {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    // Check if already connected via OAuth callback param
    if (searchParams.get('connected') === 'true') {
      setConnected(true)
      return
    }
    // Check actual connection status on mount (persisted token in DB)
    fetch('/api/calendar?action=status')
      .then(r => r.json())
      .then(data => { if (data.connected) setConnected(true) })
      .catch(() => {})
  }, [searchParams])

  const connectCalendar = async () => {
    setLoading(true)
    try {
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

  const CalendarIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )

  const ChevronLeft = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
    </svg>
  )

  const ChevronRight = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M9 5l7 7-7 7" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Calendar"
        icon={<CalendarIcon />}
        action={
          !connected ? (
            <button
              onClick={connectCalendar}
              disabled={loading}
              className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 px-4"
            >
              {loading ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <StatusPill status="active" label="Connected" size="sm" />
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          )
        }
      />

      <DashboardContent className="max-w-5xl">
        {connected ? (
          <div className="space-y-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white">
                <ChevronLeft />
              </button>
              <h2 className="text-sm font-bold tracking-tight uppercase">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="p-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white">
                <ChevronRight />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px bg-zinc-800">
              {dayNames.map(day => (
                <div key={day} className="bg-zinc-950 text-left text-zinc-500 py-2 px-2 text-[10px] uppercase tracking-widest">{day}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-zinc-800">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 bg-zinc-950/50" />
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
                    className={`h-24 bg-zinc-950 p-2 ${isToday ? 'border border-white' : 'border border-zinc-800'}`}
                  >
                    <div className={`text-xs ${isToday ? 'text-white font-bold' : 'text-zinc-500'}`}>{day}</div>
                    {dayEvents.slice(0, 2).map((event: any, idx: number) => (
                      <div key={idx} className="text-[10px] bg-blue-500/10 text-blue-400 truncate border border-blue-500/20 px-1 mt-1 py-0.5">
                        {event.summary}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Upcoming Events */}
            <div className="mt-8">
              <SectionHeader
                label="Schedule"
                title="Upcoming Events"
              />
              <div className="space-y-px bg-zinc-800">
                {events.slice(0, 5).map((event: any) => (
                  <div key={event.id} className="bg-zinc-950 p-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold tracking-tight uppercase">{event.summary}</div>
                      <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">
                        {new Date(event.start?.dateTime || event.start?.date).toLocaleString()}
                      </div>
                    </div>
                    {event.location && (
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{event.location}</div>
                    )}
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="bg-zinc-950 text-zinc-500 py-8 text-center text-xs">No upcoming events</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <svg className="h-16 w-16 text-zinc-700 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="square" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-sm font-bold tracking-tight uppercase mb-2">Connect Your Calendar</h2>
            <p className="text-xs text-zinc-500 mb-8 max-w-md mx-auto">
              Sync with Google Calendar to schedule events, manage availability, and let your agent handle bookings automatically.
            </p>
            <button
              onClick={connectCalendar}
              className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-6"
            >
              Connect Google Calendar
            </button>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<DashboardShell><DashboardContent><div className="text-zinc-500 text-xs">Loading...</div></DashboardContent></DashboardShell>}>
      <CalendarPageContent />
    </Suspense>
  )
}
