'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Clock, Trash2, Plus } from 'lucide-react'

interface TimeEntry {
  id: string
  description: string
  project: string
  startTime: string
  endTime?: string
  duration: number // seconds
  billable: boolean
}

export default function TimePage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [billable, setBillable] = useState(true)
  const [startTime, setStartTime] = useState<Date | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (running && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [running, startTime])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    setRunning(true)
    setStartTime(new Date())
    setElapsed(0)
  }

  const stopTimer = () => {
    if (startTime) {
      const entry: TimeEntry = {
        id: String(Date.now()),
        description: description || 'Untitled task',
        project: project || 'General',
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: elapsed,
        billable,
      }
      setEntries((prev) => [entry, ...prev])
    }
    setRunning(false)
    setStartTime(null)
    setElapsed(0)
    setDescription('')
    setProject('')
  }

  const totalBillable = entries.filter((e) => e.billable).reduce((s, e) => s + e.duration, 0)
  const totalTracked = entries.reduce((s, e) => s + e.duration, 0)

  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Time</div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Time Tracking</h1>
        </div>

        {/* Timer */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 mb-8">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-white mb-4">{formatTime(elapsed)}</div>
            <div className="flex justify-center gap-4">
              {!running ? (
                <button onClick={startTimer} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-6 py-3 text-sm font-bold transition-colors">
                  <Play className="h-4 w-4" /> Start
                </button>
              ) : (
                <button onClick={stopTimer} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white rounded-lg px-6 py-3 text-sm font-bold transition-colors">
                  <Pause className="h-4 w-4" /> Stop
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you working on?" className="bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50" />
            <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" className="bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="rounded" />
            <span className="text-xs text-zinc-500">Billable</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Total Tracked</div>
            <div className="mt-2 text-2xl font-bold">{formatTime(totalTracked)}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Billable</div>
            <div className="mt-2 text-2xl font-bold text-green-400">{formatTime(totalBillable)}</div>
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-2">
          {entries.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No time entries yet. Start the timer above.</p>
            </div>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{entry.description}</span>
                  {entry.billable && <span className="text-[10px] px-2 py-0.5 rounded border border-green-800 bg-green-950 text-green-400">billable</span>}
                </div>
                <div className="text-xs text-zinc-500 mt-1">{entry.project} · {new Date(entry.startTime).toLocaleTimeString()}</div>
              </div>
              <div className="text-lg font-bold">{formatTime(entry.duration)}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
