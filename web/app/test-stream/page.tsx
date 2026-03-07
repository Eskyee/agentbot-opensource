import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import TestStreamClient from './TestStreamClient'

export default async function TestStreamPage() {
  const session = await getServerSession(authOptions)
  
  const adminEmail = 'rbasefm@icloud.com'
  
  if (!session?.user?.email || session.user.email !== adminEmail) {
    redirect('/')
  }

  return <TestStreamClient />
}