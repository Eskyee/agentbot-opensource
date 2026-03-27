import { redirect } from 'next/navigation'
import { getAuthSession } from '@/app/lib/getAuthSession'
import TestStreamClient from './TestStreamClient'

export default async function TestStreamPage() {
  const session = await getAuthSession()
  
  const adminEmail = 'YOUR_ADMIN_EMAIL_2'
  
  if (!session?.user?.email || session.user.email !== adminEmail) {
    redirect('/')
  }

  return <TestStreamClient />
}
