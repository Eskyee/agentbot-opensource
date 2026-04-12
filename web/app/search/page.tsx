import { Suspense } from 'react'
import { SearchPageClient } from './SearchPageClient'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const initialQuery = typeof params.q === 'string' ? params.q : ''

  return (
    <Suspense fallback={null}>
      <SearchPageClient initialQuery={initialQuery} />
    </Suspense>
  )
}
