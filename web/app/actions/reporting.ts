'use server'

import { sendSupportAlert } from '@/app/lib/support-alert'

export async function logGlobalError(message: string, digest?: string) {
  try {
    await sendSupportAlert({
      title: '💥 Global Error Boundary Triggered',
      message: `A client hit a critical unhandled error that broke the React tree.\n\n**Error:**\n${message}`,
      metadata: { digest },
    })
  } catch (error) {
    console.error('Failed to log global error to support webhook', error)
  }
}