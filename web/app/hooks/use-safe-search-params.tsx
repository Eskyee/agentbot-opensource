'use client'

import { useSearchParams as useSearchParamsOriginal } from 'next/navigation'

// This hook should only be called from within a Suspense boundary
export function useSafeSearchParams() {
  return useSearchParamsOriginal()
}
