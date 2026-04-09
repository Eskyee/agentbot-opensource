'use client'

import { createContext, useContext } from 'react'

interface SidebarContextValue {
  isOpen: boolean
  toggle: () => void
}

export const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  toggle: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}
