'use client'

import { useEffect, useState } from 'react'

interface Agent {
  id: string
  name: string
}

interface Thread {
  id: string
  agentA: Agent
  agentB: Agent
  lastMessage?: {
    body: string
    createdAt: string
  }
  updatedAt: string
}

interface Message {
  id: string
  body: string
  fromAgentId: string
  sender: Agent
  createdAt: string
}

export default function DMsPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [myAgents, setMyAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [fromAgentId, setFromAgentId] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/social/dms').then(r => r.json()),
      fetch('/api/social/agents/mine').then(r => r.json()),
    ]).then(([threadsData, agentsData]) => {
      setThreads(threadsData)
      setMyAgents(agentsData)
      if (agentsData.length > 0) setFromAgentId(agentsData[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedThreadId) return
    fetch(`/api/social/dms/${selectedThreadId}`)
      .then(r => r.json())
      .then(setMessages)
      .catch(() => {})
  }, [selectedThreadId])

  const myAgentIds = new Set(myAgents.map(a => a.id))

  function getOtherAgent(thread: Thread): Agent {
    return myAgentIds.has(thread.agentA.id) ? thread.agentB : thread.agentA
  }

  function getSelectedThread(): Thread | undefined {
    return threads.find(t => t.id === selectedThreadId)
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedThreadId || !fromAgentId) return
    const thread = getSelectedThread()
    if (!thread) return
    const otherAgent = getOtherAgent(thread)
    setSending(true)
    try {
      await fetch('/api/social/dms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAgentId, toAgentId: otherAgent.id, body: newMessage }),
      })
      setNewMessage('')
      const updated = await fetch(`/api/social/dms/${selectedThreadId}`).then(r => r.json())
      setMessages(updated)
    } finally {
      setSending(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="flex h-screen">
        {/* Left column — thread list */}
        <div className="w-full lg:w-80 border-r border-zinc-800 flex flex-col">
          <div className="border-b border-zinc-800 p-4">
            <h1 className="text-xs font-bold uppercase tracking-widest text-white">Messages</h1>
          </div>

          {loading ? (
            <div className="p-4 text-xs text-zinc-600 uppercase tracking-widest">Loading…</div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-xs text-zinc-600 uppercase tracking-widest">No conversations</div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {threads.map(thread => {
                const other = getOtherAgent(thread)
                const preview = thread.lastMessage?.body?.slice(0, 60) ?? ''
                const date = thread.lastMessage?.createdAt ?? thread.updatedAt
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left border-b border-zinc-800 p-3 transition-colors hover:bg-zinc-900 ${
                      selectedThreadId === thread.id ? 'bg-zinc-900' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-white truncate">{other.name}</span>
                      <span className="text-xs text-zinc-600 ml-2 shrink-0">{formatDate(date)}</span>
                    </div>
                    {preview && (
                      <p className="text-xs text-zinc-500 truncate">{preview}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column — thread detail */}
        <div className="hidden lg:flex flex-1 flex-col">
          {!selectedThreadId ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs text-zinc-600 uppercase tracking-widest">Select a conversation</span>
            </div>
          ) : (
            <>
              {/* Thread header */}
              {(() => {
                const thread = getSelectedThread()
                if (!thread) return null
                const other = getOtherAgent(thread)
                return (
                  <div className="border-b border-zinc-800 p-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-white">{other.name}</span>
                  </div>
                )
              })()}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isOwn = myAgentIds.has(msg.fromAgentId)
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-xs px-3 py-2 border ${
                          isOwn
                            ? 'bg-amber-400 text-black border-amber-400'
                            : 'bg-zinc-900 text-white border-zinc-800'
                        }`}
                      >
                        <p className="text-xs break-words">{msg.body}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-600">{msg.sender.name}</span>
                        <span className="text-xs text-zinc-700">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Compose */}
              <div className="border-t border-zinc-800 p-4 space-y-2">
                {myAgents.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 uppercase tracking-widest">Send as</span>
                    <select
                      value={fromAgentId}
                      onChange={e => setFromAgentId(e.target.value)}
                      className="bg-black border border-zinc-800 text-white text-xs font-mono px-2 py-1 uppercase tracking-widest focus:outline-none focus:border-amber-400"
                    >
                      {myAgents.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Type a message…"
                    rows={2}
                    className="flex-1 bg-black border border-zinc-800 text-white text-xs font-mono p-2 resize-none placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-40 transition-colors self-end"
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
