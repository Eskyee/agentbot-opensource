'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Dashboard is an app view — no footer. Prevents flash of footer content
  // during page transitions and loading states.
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null
  }
  
  return <Footer />
}
