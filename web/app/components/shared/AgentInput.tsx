import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AgentInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function AgentInput({ label, hint, className, ...props }: AgentInputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          {label}
        </label>
      )}
      <Input
        className={cn(
          'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600',
          'focus:border-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0',
          className
        )}
        {...props}
      />
      {hint && (
        <p className="text-xs text-zinc-500 mt-2">{hint}</p>
      )}
    </div>
  )
}

interface AgentTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function AgentTextarea({ label, hint, className, ...props }: AgentTextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3',
          'text-sm text-white placeholder:text-zinc-600',
          'focus:outline-none focus:border-zinc-600',
          'font-mono resize-none',
          className
        )}
        {...props}
      />
      {hint && (
        <p className="text-xs text-zinc-500 mt-2">{hint}</p>
      )}
    </div>
  )
}
