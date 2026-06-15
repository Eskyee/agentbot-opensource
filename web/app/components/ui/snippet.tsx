/**
 * Snippet — copy-to-clipboard command block, adapted from vercel/ui (Geist)
 * for the agentbot brand (mono, zinc-on-black, orange accent).
 */
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const snippetVariants = cva('relative max-w-full rounded-md border py-2.5 pl-3 pr-12 font-mono', {
  variants: {
    variant: {
      default: 'border-zinc-800 bg-zinc-950 text-zinc-300',
      invert: 'border-zinc-200 bg-white text-zinc-900',
      success: 'border-green-900 bg-green-950/40 text-green-300',
      error: 'border-red-900 bg-red-950/40 text-red-300',
      warning: 'border-amber-900 bg-amber-950/40 text-amber-300',
      brand: 'border-orange-900 bg-orange-950/30 text-orange-300',
    },
  },
  defaultVariants: { variant: 'default' },
})

interface SnippetProps {
  text: string | string[]
  width?: string
  onCopy?: () => void
  type?: VariantProps<typeof snippetVariants>['variant']
  prompt?: boolean
  className?: string
}

export function Snippet({ text, width, prompt = true, onCopy, type = 'default', className }: SnippetProps) {
  const textArray = Array.isArray(text) ? text : [text]
  const [copied, setCopied] = React.useState(false)

  function copyTextHandler() {
    if (copied) return
    navigator.clipboard.writeText(textArray.join('\n')).then(() => {
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <div className={cn(snippetVariants({ variant: type }), className)} style={{ width }}>
      <div className="flex-1">
        {textArray.map((line, index) => (
          <pre
            key={index}
            className={cn(
              'overflow-x-auto text-[13px]',
              prompt && "before:select-none before:text-zinc-600 before:content-['$_']"
            )}
          >
            {line}
          </pre>
        ))}
      </div>

      <button
        onClick={copyTextHandler}
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-zinc-500 transition-colors hover:text-white"
      >
        <Check
          className={cn(
            'absolute h-4 w-4 text-green-400 transition-all duration-150',
            copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          )}
        />
        <Copy
          className={cn(
            'absolute h-4 w-4 transition-all duration-150',
            copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
          )}
        />
      </button>
    </div>
  )
}
