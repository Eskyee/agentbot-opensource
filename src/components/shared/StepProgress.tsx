import { cn } from '@/lib/utils'

interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('mb-12 overflow-x-auto pb-2', className)}>
      <div className="flex min-w-max items-center justify-center gap-2 px-2">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-mono',
                i === currentStep && 'bg-white text-black',
                i < currentStep && 'bg-green-500 text-white',
                i > currentStep && 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              )}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5',
                  i < currentStep ? 'bg-green-500' : 'bg-zinc-800'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
