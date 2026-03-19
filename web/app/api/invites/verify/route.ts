import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Verify invite code (mock - replace with real database check)
    const isValid = code.startsWith('invite-') && code.length > 20

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      message: 'Invite code is valid',
    })
  } catch (error) {
    console.error('Failed to verify invite:', error)
    return NextResponse.json(
      { error: 'Failed to verify invite' },
      { status: 500 }
    )
  }
}
