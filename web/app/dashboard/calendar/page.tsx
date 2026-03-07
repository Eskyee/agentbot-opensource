'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const navItems = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📋', label: 'Tasks', href: '/dashboard/tasks' },
  { icon: '🎨', label: 'Personality', href: '/dashboard/personality' },
  { icon: '🔧', label: 'Skills', href: '/dashboard/skills' },
  { icon: '🤖', label: 'Swarms', href: '/dashboard/swarms' },
  { icon: '⚡', label: 'Workflows', href: '/dashboard/workflows' },
  { icon: '📁', label: 'Files', href: '/dashboard/files' },
  { icon: '📆', label: 'Calendar', href: '/dashboard/calendar' },
  { icon: '💓', label: 'Heartbeat', href: '/dashboard/heartbeat' },
  { icon: '✅', label: 'Verify', href: '/dashboard/verify' },
  { icon: '🎛️', label: 'DJ Stream', href: '/dashboard/dj-stream' },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace' },
  { icon: '💳', label: 'Billing', href: '/billing' },
  { icon: '🔑', label: 'API Keys', href: '/dashboard/keys' },
  { icon: '⚙️', label: 'Settings', href: '/settings' },
]

function CalendarPageContent() {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('agentbot_instance')
    if (stored) {
      const parsed = JSON.parse(stored)
      setUserId(parsed.userId || '')
    }
    
    if (searchParams.get('connected') === 'true') {
      setConnected(true)
    }
  }, [searchParams])

  const connectCalendar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/calendar?action=connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', userId })
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

  const fetchEvents = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
      const res = await fetch(`/api/calendar?action=list&userId=${userId}&start=${start}&end=${end}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (connected && userId) {
      fetchEvents()
    }
  }, [connected, userId, currentDate])

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
    <div className="flex h-screen bg-black text-white">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Agentbot</h1>
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.href === '/dashboard/calendar' 
                    ? 'bg-white/20 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Calendar</h1>
            {!connected ? (
              <button
                onClick={connectCalendar}
                disabled={loading}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Google Calendar'}
              </button>
            ) : (
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            )}
          </div>

          {connected ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-lg">←</button>
                <h2 className="text-xl font-semibold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-lg">→</button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-gray-400 py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 bg-gray-900/50 rounded-lg" />
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
                      className={`h-24 bg-gray-900 rounded-lg p-2 ${isToday ? 'border border-white' : ''}`}
                    >
                      <div className={`text-sm ${isToday ? 'text-white font-bold' : 'text-gray-400'}`}>{day}</div>
                      {dayEvents.slice(0, 2).map((event: any, idx: number) => (
                        <div key={idx} className="text-xs bg-blue-900/50 text-blue-200 truncate rounded px-1 mt-1">
                          {event.summary}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 mt-1">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
                <div className="space-y-2">
                  {events.slice(0, 5).map((event: any) => (
                    <div key={event.id} className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{event.summary}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(event.start?.dateTime || event.start?.date).toLocaleString()}
                        </div>
                      </div>
                      {event.location && (
                        <div className="text-sm text-gray-500">{event.location}</div>
                      )}
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-gray-500 text-center py-8">No upcoming events</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📆</div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Calendar</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Sync with Google Calendar to schedule events, manage availability, and let your agent handle bookings automatically.
              </p>
              <button
                onClick={connectCalendar}
                className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200"
              >
                Connect Google Calendar
              </button>
            </div>
          )}
        </div>
      </main>
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
