'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function TasksPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    cronSchedule: '0 9 * * *',
    prompt: ''
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const res = await fetch('/api/scheduled-tasks')
    const data = await res.json()
    setTasks(data.tasks || [])
  }

  const createTask = async () => {
    await fetch('/api/scheduled-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTask,
        agentId: 'default'
      })
    })
    setShowCreate(false)
    fetchTasks()
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Scheduled Tasks</h1>
            <p className="text-gray-400 mt-2">Automate your agent with scheduled tasks</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            + Create Task
          </button>
        </div>

        {showCreate && (
          <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Create Scheduled Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Task Name</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                  placeholder="Daily market report"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Schedule (Cron)</label>
                <input
                  type="text"
                  value={newTask.cronSchedule}
                  onChange={(e) => setNewTask({...newTask, cronSchedule: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 font-mono"
                  placeholder="0 9 * * *"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: "0 9 * * *" (9am daily), "0 */6 * * *" (every 6 hours)
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">What should the agent do?</label>
                <textarea
                  value={newTask.prompt}
                  onChange={(e) => setNewTask({...newTask, prompt: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-32"
                  placeholder="Generate a daily market report with top 5 crypto trends..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createTask}
                  className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="border border-gray-700 px-6 py-2 rounded-lg hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
              <p className="text-gray-400">No scheduled tasks yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 text-white hover:underline"
              >
                Create your first task →
              </button>
            </div>
          ) : (
            tasks.map((task: any) => (
              <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{task.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-2 font-mono">{task.cronSchedule}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${task.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {task.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-300">{task.prompt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
