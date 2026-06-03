import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const maxDuration = 120

// Browser automation actions
// Connects to a remote browser instance for web automation
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, url, selector, text, steps } = await req.json()

    // Validate action
    const validActions = ['navigate', 'screenshot', 'click', 'type', 'extract', 'fill-form', 'automate']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      }, { status: 400 })
    }

    // Proxy to Playwright backend
    const BROWSER_URL = process.env.AGENTBOT_BROWSER_URL || 'https://agentbot-browser-production.up.railway.app'

    try {
      const res = await fetch(`${BROWSER_URL}/${action === 'fill-form' ? 'fill-form' : action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, selector, text, steps, fields: steps, fullPage: true }),
        signal: AbortSignal.timeout(60000),
      })
      const data = await res.json()
      return NextResponse.json(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Browser service unavailable'
      return NextResponse.json({ error: msg, service: 'playwright-backend' }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Browser Automation API',
    version: '0.1.0-beta',
    status: 'beta',
    capabilities: [
      'navigate — Go to a URL',
      'screenshot — Capture page screenshot',
      'click — Click an element',
      'type — Type text into a field',
      'extract — Extract content from a page',
      'fill-form — Fill and submit forms',
      'automate — Multi-step browser workflows',
    ],
    note: 'Browser automation is in beta. Requires Playwright instance for full functionality.',
  })
}
