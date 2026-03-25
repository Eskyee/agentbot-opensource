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

  return (
    <DashboardShell>
      <DashboardHeader
        title="Scheduled Tasks"
        icon={<Clock className="h-5 w-5 text-blue-400" />}
        count={tasks.length}
        action={
          <Button
            className="bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Task
          </Button>
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        {/* Create form */}
        {showCreate && (
          <AgentCard className="border-blue-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">
              New Scheduled Task
            </h2>
            <AgentInput
              label="Task Name"
              placeholder="Daily market report"
              value={newTask.name}
              onChange={(e) =>
                setNewTask({ ...newTask, name: e.target.value })
              }
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500">
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
                onChange={(e) => handleScheduleChange(e.target.value)}
                hint={
                  useNatural
                    ? 'Examples: "every day at 9am", "every monday at 2pm", "every 6 hours"'
                    : 'Cron format: minute hour day month weekday'
                }
              />
              {useNatural && (
                <p className="text-xs text-green-400 mt-1">
                  → Converts to: {newTask.cronSchedule}
                </p>
              )}
            </div>
            <AgentTextarea
              label="What should the agent do?"
              placeholder="Generate a daily market report with top 5 crypto trends..."
              value={newTask.prompt}
              onChange={(e) =>
                setNewTask({ ...newTask, prompt: e.target.value })
              }
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                className="bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest"
                onClick={createTask}
              >
                Create Task
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-bold uppercase tracking-widest"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </AgentCard>
        )}

        {/* Task list */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-8 w-8 text-zinc-600" />}
            title="No scheduled tasks yet"
            description="Automate your agent with scheduled tasks"
            action={
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest"
                onClick={() => setShowCreate(true)}
              >
                Create your first task →
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <AgentCard key={task.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tighter">{task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-zinc-400 mt-1">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {cronToNatural(task.cronSchedule)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      task.enabled
                        ? 'border-green-500/30 text-green-400'
                        : 'border-zinc-700 text-zinc-400'
                    }
                  >
                    {task.enabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="mt-4 p-4 bg-black/30 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-300 font-mono">
                    {task.prompt}
                  </p>
                </div>
              </AgentCard>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
