'use client'

import { useState, useEffect, useCallback } from 'react'
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
import Link from 'next/link'

interface Agent {
  id: string
  name: string
}

interface Task {
  id: string
  name: string
  description: string | null
  cronSchedule: string
  prompt: string
  enabled: boolean
  lastRun: string | null
  nextRun: string | null
  agentId: string
  createdAt: string
  updatedAt: string
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

export default function TasksPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [useNatural, setUseNatural] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    cronSchedule: '0 9 * * *',
    naturalSchedule: 'every day at 9am',
    prompt: '',
  })

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        const data = await res.json()
        const agentList: Agent[] = (data.agents || []).map((a: any) => ({
          id: a.id,
          name: a.name,
        }))
        setAgents(agentList)
        if (agentList.length > 0) {
          setSelectedAgentId(agentList[0].id)
        }
      } catch {
        showToast('Failed to load agents', 'error')
      }
    }
    fetchAgents()
  }, [showToast])

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/scheduled-tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch {
      showToast('Failed to load tasks', 'error')
    }
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
    if (!selectedAgentId) {
      showToast('Select an agent first', 'error')
      return
    }
    if (!newTask.name || !newTask.prompt) {
      showToast('Name and prompt are required', 'error')
      return
    }
    try {
      const res = await fetch('/api/scheduled-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTask.name,
          description: newTask.description || undefined,
          cronSchedule: newTask.cronSchedule,
          prompt: newTask.prompt,
          agentId: selectedAgentId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to create task', 'error')
        return
      }
      setShowCreate(false)
      setNewTask({
        name: '',
        description: '',
        cronSchedule: '0 9 * * *',
        naturalSchedule: 'every day at 9am',
        prompt: '',
      })
      showToast('Task created', 'success')
      fetchTasks()
    } catch {
      showToast('Failed to create task', 'error')
    }
  }

  const toggleTask = async (task: Task) => {
    try {
      const res = await fetch('/api/scheduled-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, enabled: !task.enabled }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to toggle task', 'error')
        return
      }
      showToast(task.enabled ? 'Task paused' : 'Task enabled', 'success')
      fetchTasks()
    } catch {
      showToast('Failed to toggle task', 'error')
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/scheduled-tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to delete task', 'error')
        return
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      showToast('Task deleted', 'success')
    } catch {
      showToast('Failed to delete task', 'error')
    }
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent?.name || agentId
  }

  const ClockIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  // No agents deployed — show empty state
  if (agents.length === 0 && !toast) {
    // Wait until agents have been fetched (check if fetch completed)
    // We show this only after mount completes
  }

  return (
    <DashboardShell>
      {/* Toast banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 text-xs font-bold uppercase tracking-widest border ${
            toast.type === 'success'
              ? 'bg-green-950 border-green-800 text-green-400'
              : 'bg-red-950 border-red-800 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      <DashboardHeader
        title="Scheduled Tasks"
        icon={<ClockIcon />}
        count={tasks.length}
        action={
          agents.length > 0 ? (
            <button
              className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-4"
              onClick={() => setShowCreate(true)}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Task
              </span>
            </button>
          ) : undefined
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        {/* No agents empty state */}
        {agents.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-8 w-8 text-zinc-600" />}
            title="No agents deployed yet"
            description="Deploy one from the Marketplace to start scheduling tasks"
            action={
              <Link href="/marketplace">
                <button className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4">
                  Go to Marketplace
                </button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Create form */}
            {showCreate && (
              <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                <h2 className="text-sm font-bold tracking-tight uppercase">
                  New Scheduled Task
                </h2>

                {/* Agent selector */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">
                    Agent
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs px-3 py-2.5 focus:outline-none focus:border-zinc-600 appearance-none"
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    Create your first task
                  </button>
                }
              />
            ) : (
              <div className="space-y-px bg-zinc-800">
                {tasks.map((task: Task) => (
                  <div key={task.id} className="border border-zinc-800 bg-zinc-950 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold tracking-tight uppercase">{task.name}</h3>
                        <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-widest">
                          {getAgentName(task.agentId)}
                        </p>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTask(task)}
                          className="border border-zinc-800 hover:border-zinc-600 p-2 text-zinc-400 hover:text-white transition-colors"
                          title={task.enabled ? 'Pause task' : 'Enable task'}
                        >
                          {task.enabled ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="border border-zinc-800 hover:border-red-800 p-2 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <StatusPill
                          status={task.enabled ? 'active' : 'offline'}
                          label={task.enabled ? 'Active' : 'Paused'}
                          size="sm"
                        />
                      </div>
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
          </>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
