'use client'

import { useState, memo } from 'react'
import { useSession, signIn } from 'next-auth/react'
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

export default memo(function AskAtlas() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const { messages, sendMessage, status: chatStatus, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/support/chat' }),
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: `Hey there! I'm Atlas, your Agentbot support agent powered by MiMo V2.5 Pro. I can help with:\n\n• Getting started with Agentbot\n• Pricing and plans\n• Connecting channels (Telegram, Discord, WhatsApp, X)\n• BYOK setup with your MiMo subscription\n• Troubleshooting issues\n• OpenClaw configuration\n\nWhat do you need help with?` }],
      },
    ],
  })

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text })
    }
  }

  if (status === 'loading') return null

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-orange-500 hover:bg-orange-400 rounded-full flex items-center justify-center text-black shadow-lg shadow-orange-500/20 transition-all hover:scale-110 z-50 font-mono"
        aria-label={isOpen ? 'Close support chat' : 'Ask Atlas for help'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-lg font-bold">A</span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-background border border-border rounded-lg shadow-2xl shadow-orange-500/10 flex flex-col z-50 overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
                Ask Atlas
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Powered by MiMo
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!session ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Sign in to chat with Atlas</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  AI support powered by MiMo V2.5 Pro
                </p>
              </div>
              <button
                onClick={() => signIn('google')}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          ) : (
            <>
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
                  <PromptInputTextarea placeholder="Ask a question..." />
                  <PromptInputSubmit
                    status={chatStatus === 'streaming' ? 'streaming' : chatStatus === 'submitted' ? 'submitted' : 'ready'}
                    onStop={stop}
                  />
                </PromptInput>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
})
