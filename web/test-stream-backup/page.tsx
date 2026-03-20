import { redirect } from 'next/navigation'
import TestStreamClient from './TestStreamClient'

export default async function TestStreamPage() {
  const session = null
  
  const adminEmail = 'rbasefm@icloud.com'
  
  if (!session?.user?.email || session.user.email !== adminEmail) {
    redirect('/')
  }

  return <TestStreamClient />
}