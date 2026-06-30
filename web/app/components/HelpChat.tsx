'use client'

import { useState, memo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '../../components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '../../components/ai-elements/message'
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
} from '../../components/ai-elements/prompt-input'

export default memo(function HelpChat() {
  const [isOpen, setIsOpen] = useState(false)

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/demo/chat' }),
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: '🔮 Hey! I\'m your Agentbot — deploying autonomous agents for music operations on Base. Ask me about pricing, skills (Visual Synthesizer, Track Archaeologist, Setlist Oracle, Groupie Manager), or how to get your crew running 24/7.' }],
      },
    ],
  })

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text })
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-red-600 hover:bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-bold text-white">Agentbot Helper</span>
          </div>

          <Conversation className="flex-1">
            <ConversationContent className="p-4">
              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          )
                        default:
                          return null
                      }
                    })}
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-border p-3">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea placeholder="Ask for help..." />
              <PromptInputSubmit
                status={status === 'streaming' ? 'streaming' : status === 'submitted' ? 'submitted' : 'ready'}
                onStop={stop}
              />
            </PromptInput>
          </div>
        </div>
      )}
    </>
  )
})
