import { NextResponse } from 'next/server'
import { generateCSRFToken } from '@/app/lib/csrf'

export async function GET() {
  const { token, signed } = generateCSRFToken()
  return NextResponse.json({ token, signed, header: `${token}:${signed}` })
}
