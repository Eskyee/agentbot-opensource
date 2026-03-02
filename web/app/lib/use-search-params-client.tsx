'use client'

import { ReactNode, Suspense } from 'react'
import { useSearchParams as useSearchParamsOriginal } from 'next/navigation'

export function useSearchParams() {
  return useSearchParamsOriginal()
}

export function WithSearchParams({ children }: { children: (searchParams: ReturnType<typeof useSearchParamsOriginal>) => ReactNode }) {
  const searchParams = useSearchParamsOriginal()
  return <>{children(searchParams)}</>
}

export function SearchParamsWrapper({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback || <div className="min-h-screen" />}>
      {children}
    </Suspense>
  )
}
