'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, Plus, Pause, Play, Trash2, Terminal, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'
import { AgentInput, AgentTextarea } from '@/app/components/shared/AgentInput'
import { AgentCard } from '@/app/components/shared/AgentCard'
import { EmptyState } from '@/app/components/shared/EmptyState'
import { naturalToCron, cronToNatural } from '@/lib/cron-parser'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [useNatural, setUseNatural] = useState(true)
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    cronSchedule: '0 9 * * *',
    naturalSchedule: 'every day at 9am',
    prompt: '',
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const res = await fetch('/api/scheduled-tasks')
    const data = await res.json()
    setTasks(data.tasks || [])
  }

  const handleScheduleChange = (value: string) => {
    if (useNatural) {
      const cron = naturalToCron(value)
      setNewTask({
        ...newTask,
        naturalSchedule: value,
        cronSchedule: cron || '0 9 * * *',
      })
    } else {
      setNewTask({
        ...newTask,
        cronSchedule: value,
        naturalSchedule: cronToNatural(value),
      })
    }
  }

  const createTask = async () => {
    await fetch('/api/scheduled-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTask, agentId: 'default' }),
    })
    setShowCreate(false)
    setNewTask({
      name: '',
      description: '',
      cronSchedule: '0 9 * * *',
      naturalSchedule: 'every day at 9am',
      prompt: '',
    })
    fetchTasks()
  }

  const ClockIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Scheduled Tasks"
        icon={<ClockIcon />}
        count={tasks.length}
        action={
          <button
            className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-4"
            onClick={() => setShowCreate(true)}
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Task
            </span>
          </button>
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        {/* Create form */}
        {showCreate && (
          <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <h2 className="text-sm font-bold tracking-tight uppercase">
              New Scheduled Task
            </h2>
            <AgentInput
              label="Task Name"
              placeholder="Daily market report"
              value={newTask.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTask({ ...newTask, name: e.target.value })
              }
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-600">
                  Schedule
                </label>
                <button
                  onClick={() => setUseNatural(!useNatural)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                >
                  {useNatural ? (
                    <><Terminal className="h-3 w-3" /> Use cron syntax</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Use natural language</>
                  )}
                </button>
              </div>
              <AgentInput
                placeholder={useNatural ? 'every day at 9am' : '0 9 * * *'}
                value={useNatural ? newTask.naturalSchedule : newTask.cronSchedule}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleScheduleChange(e.target.value)}
                hint={
                  useNatural
                    ? 'Examples: "every day at 9am", "every monday at 2pm", "every 6 hours"'
                    : 'Cron format: minute hour day month weekday'
                }
              />
              {useNatural && (
                <p className="text-[10px] text-green-400 mt-1 uppercase tracking-widest">
                  Converts to: {newTask.cronSchedule}
                </p>
              )}
            </div>
            <AgentTextarea
              label="What should the agent do?"
              placeholder="Generate a daily market report with top 5 crypto trends..."
              value={newTask.prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewTask({ ...newTask, prompt: e.target.value })
              }
              rows={4}
            />
            <div className="flex gap-3">
              <button
                className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-6"
                onClick={createTask}
              >
                Create Task
              </button>
              <button
                className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Task list */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-8 w-8 text-zinc-600" />}
            title="No scheduled tasks yet"
            description="Automate your agent with scheduled tasks"
            action={
              <button
                className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4"
                onClick={() => setShowCreate(true)}
              >
                Create your first task →
              </button>
            }
          />
        ) : (
          <div className="space-y-px bg-zinc-800">
            {tasks.map((task: any) => (
              <div key={task.id} className="border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight uppercase">{task.name}</h3>
                    {task.description && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {task.description}
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      {cronToNatural(task.cronSchedule)}
                    </p>
                  </div>
                  <StatusPill
                    status={task.enabled ? 'active' : 'offline'}
                    label={task.enabled ? 'Active' : 'Paused'}
                    size="sm"
                  />
                </div>
                <div className="mt-4 p-4 border border-zinc-800 bg-black">
                  <p className="text-xs text-zinc-300 font-mono">
                    {task.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
