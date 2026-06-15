/**
 * ShowMore — divider with expand/collapse trigger, adapted from vercel/ui (Geist).
 */
'use client'

import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ShowMoreProps {
  expanded: boolean
  onClick: () => void
  moreLabel?: string
  lessLabel?: string
  className?: string
}

export function ShowMore({
  expanded,
  onClick,
  moreLabel = 'Show more',
  lessLabel = 'Show less',
  className,
}: ShowMoreProps) {
  return (
    <div className={cn('flex min-h-[30px] w-full items-center gap-3', className)}>
      <div className="h-px flex-1 bg-zinc-800" />
      <Button size="sm" variant="outline" onClick={onClick} aria-expanded={expanded}>
        <span>{expanded ? lessLabel : moreLabel}</span>
        <ChevronDownIcon className={cn('ml-1 transition-transform', expanded && 'rotate-180')} />
      </Button>
      <div className="h-px flex-1 bg-zinc-800" />
    </div>
  )
}
