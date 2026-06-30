'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '../../../components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '../../../components/ai-elements/message'
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
} from '../../../components/ai-elements/prompt-input'

const SUGGESTIONS = [
  'What can you do?',
  'How do I deploy an agent?',
  'What is x402?',
  'Tell me about baseFM',
  'What models do you support?',
  'How much does it cost?',
]

export function DemoChat() {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/demo/chat' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text })
    }
  }

  const speak = async (text: string, idx: number) => {
    if (playingIdx === idx) {
      audioRef.current?.pause()
      setPlayingIdx(null)
      return
    }
    audioRef.current?.pause()
    setPlayingIdx(idx)
    try {
      const res = await fetch('/api/demo/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPlayingIdx(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPlayingIdx(null); URL.revokeObjectURL(url) }
      audio.play()
    } catch {
      setPlayingIdx(null)
    }
  }

  const getText = (parts: Array<{ type: string; text?: string }>) =>
    parts.filter(p => p.type === 'text').map(p => p.text || '').join('')

  return (
    <div className="border border-border bg-background flex flex-col h-[600px]">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Live Demo — Free Model</span>
        <span className="ml-auto text-[10px] text-muted-foreground">10 messages free</span>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="p-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-muted-foreground text-sm mb-6">Try asking me anything. I&apos;m powered by MiMo V2.5 Pro.</p>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage({ text: s })}
                    className="text-left text-xs text-muted-foreground border border-border px-3 py-2 hover:border-muted-foreground/50 hover:text-foreground transition-colors rounded-lg"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <div key={`${message.id}-${i}`}>
                            <MessageResponse>{part.text}</MessageResponse>
                            {message.role === 'assistant' && !isLoading && part.text && (
                              <button
                                onClick={() => speak(part.text!, messages.indexOf(message))}
                                className="mt-2 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs"
                                title="Listen"
                              >
                                {playingIdx === messages.indexOf(message) ? (
                                  <><span className="animate-pulse">■</span> Stop</>
                                ) : (
                                  <><span>🔊</span> Speak</>
                                )}
                              </button>
                            )}
                          </div>
                        )
                      default:
                        return null
                    }
                  })}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea placeholder="Ask Agentbot anything..." />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : status === 'submitted' ? 'submitted' : 'ready'}
            onStop={stop}
          />
        </PromptInput>
      </div>
    </div>
  )
}
