'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageSquareIcon } from 'lucide-react'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
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

const SUGGESTIONS = [
  'How do I deploy an agent?',
  'What plans are available?',
  'How does BYOK work?',
]

export default function ChatPage() {
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai-chat' }),
  })

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text })
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-screen">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquareIcon className="size-12" />}
                title="Atlas Chat"
                description="Ask anything about Agentbot — setup, troubleshooting, billing, or just say hi."
              >
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage({ text: q })}
                      className="px-3 py-1.5 text-xs border border-border rounded-full hover:bg-accent transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => (
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
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="p-4">
          <PromptInputTextarea placeholder="Message Atlas..." />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : status === 'submitted' ? 'submitted' : 'ready'}
            onStop={stop}
          />
        </PromptInput>
      </div>
    </main>
  )
}
