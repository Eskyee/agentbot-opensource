import { NextRequest, NextResponse } from 'next/server'

// This would connect to a database in production
// For now, we'll use a simple in-memory store
const keyStore = new Map()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keyId } = await params

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      )
    }

    // In production, delete from database
    keyStore.delete(keyId)

    return NextResponse.json({
      success: true,
      message: 'Key revoked successfully',
    })
  } catch (error) {
    console.error('Failed to revoke key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke key' },
      { status: 500 }
    )
  }
}
