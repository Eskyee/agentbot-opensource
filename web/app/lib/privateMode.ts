import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const PRIVATE_MODE = process.env.PRIVATE_MODE === 'true'
const INVITE_REQUIRED = process.env.INVITE_REQUIRED === 'true'

// Check if user has valid invite code or is authenticated
export async function checkPrivateAccess(request: any) {
  if (!PRIVATE_MODE) return { allowed: true }

  try {
    const headersList = await headers()
    const auth = headersList.get('authorization')
    const inviteCode = headersList.get('x-invite-code')

    // Check authentication
    if (auth) {
      return { allowed: true, type: 'authenticated' }
    }

    // Check invite code
    if (inviteCode) {
      const response = await fetch(`${process.env.BACKEND_API_URL}/api/invites/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      })
      
      if (response.ok) {
        return { allowed: true, type: 'invited' }
      }
    }

    return { allowed: false, type: 'none' }
  } catch (error) {
    console.error('Private access check failed:', error)
    return { allowed: false, type: 'error' }
  }
}

export function requirePrivateAccess() {
  if (!PRIVATE_MODE) return null

  return NextResponse.json(
    { error: 'Access denied. This is a private platform. Contact support for access.' },
    { status: 403 }
  )
}
