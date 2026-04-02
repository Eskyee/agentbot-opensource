import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'

export async function GET() {
  try {
    const version = (await readFile(new URL('./VERSION', import.meta.url), 'utf-8')).trim()
    return NextResponse.json({ version })
  } catch {
    return NextResponse.json({ version: 'v0.0.0' })
  }
}

export const dynamic = 'force-dynamic'
