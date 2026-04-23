'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, RefreshCw, Bot, User } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const CHARACTERS = [
  { id: 'selector', name: 'The Selector', emoji: '🎵', desc: 'A&R specialist. Knows what hits.' },
  { id: 'basement', name: 'Basement Operator', emoji: '🔊', desc: 'Factory veteran. No fluff.' },
  { id: 'road', name: 'Road Manager', emoji: '🚐', desc: 'Tour logistics. Grind mentality.' },
  { id: 'label', name: 'Label Exec', emoji: '💰', desc: 'Business side. Numbers matter.' },
  { id: 'ar', name: 'A&R Scout', emoji: '🎯', desc: 'Talent finder. Pattern recognition.' },
]

export default function CharacterQAPage() {
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    // Simulated response
    await new Promise(r => setTimeout(r, 1200))

    const responses: Record<string, string[]> = {
      selector: [
        'From an A&R perspective, the hook needs to hit in the first 8 bars. Listeners decide in 3 seconds.',
        'The market is saturated with mid-tempo right now. Either go harder or go slower — the middle is dead.',
        'Send me the demo. If it makes me nod my head, we talk numbers.',
      ],
      basement: [
        'Real talk — if you need a plugin to sound raw, you already lost the plot. Start with the sample.',
        'The autonomous doesn\'t care about your follower count. Can you play a 2-hour set without stopping?',
        'That sound you\'re chasing? It\'s a Juno-60 through a broken preamp. Good luck finding one.',
      ],
      road: [
        'Three cities in four days? Doable if you skip soundcheck. Not recommended but doable.',
        'Rider essentials: two towels, cold water, no brown M&Ms. Seriously though, hydration matters.',
        'The van leaves at 6 AM. If you\'re late, you\'re walking to the next venue.',
      ],
      label: [
        'Streaming pays 0.003 per play. You need 333,000 plays to make $1,000. Think about that.',
        'Sync licensing is where the real money is. One TV placement beats 100K Spotify streams.',
        'Your split sheets aren\'t done? We can\'t distribute until they are. No exceptions.',
      ],
      ar: [
        'I look for three things: voice, story, consistency. Most artists have one. Very few have all three.',
        'Your last three releases showed growth. Keep that trajectory and we have something to talk about.',
        'The best artists I\'ve signed were terrible in the room but incredible on record. Performance can be taught.',
      ],
    }

    const charResponses = responses[selectedCharacter.id] || responses.selector
    const reply: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: charResponses[Math.floor(Math.random() * charResponses.length)],
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, reply])
    setSending(false)
  }

  const clearChat = () => setMessages([])

  return (
    <DashboardShell>
      <DashboardHeader
        title="Character Q&A"
        icon={<MessageSquare className="h-5 w-5 text-blue-400" />}
        count={messages.length}
        action={
          <button
            onClick={clearChat}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Clear
          </button>
        }
      />

      <DashboardContent className="max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Character selector */}
          <div className="lg:col-span-1">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-bold">
              Characters
            </div>
            <div className="space-y-2">
              {CHARACTERS.map(char => (
                <button
                  key={char.id}
                  onClick={() => {
                    setSelectedCharacter(char)
                    setMessages([])
                  }}
                  className={`w-full text-left p-3 border transition-all ${
                    selectedCharacter.id === char.id
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{char.emoji}</span>
                    <span className="text-xs font-bold text-white">{char.name}</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-mono">{char.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="lg:col-span-3">
            <div className="border border-zinc-800 bg-zinc-950 flex flex-col h-[600px]">
              {/* Chat header */}
              <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-2">
                <span className="text-lg">{selectedCharacter.emoji}</span>
                <span className="text-sm font-bold text-white">{selectedCharacter.name}</span>
                <span className="text-[10px] text-zinc-600 font-mono ml-auto">{selectedCharacter.desc}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Bot className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                      <p className="text-sm text-zinc-600 font-mono">
                        Ask {selectedCharacter.name} anything
                      </p>
                      <p className="text-xs text-zinc-700 font-mono mt-1">
                        Music industry advice, feedback, tough love
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-sm">{selectedCharacter.emoji}</span>
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-blue-600/10 border border-blue-500/20 text-blue-100'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="h-3.5 w-3.5 text-zinc-500" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-zinc-800 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={`Ask ${selectedCharacter.name}...`}
                    className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="px-4 py-2.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 disabled:opacity-30 transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
