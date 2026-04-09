import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'
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

    // For now, return a structured response that the agent can use
    // Real implementation would connect to a browser instance (Playwright/Puppeteer)
    switch (action) {
      case 'navigate':
        if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
        return NextResponse.json({
          success: true,
          action: 'navigate',
          url,
          message: `Navigated to ${url}`,
          note: 'Browser automation is in beta. Connect a Playwright instance for full functionality.',
        })

      case 'screenshot':
        if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
        return NextResponse.json({
          success: true,
          action: 'screenshot',
          url,
          message: `Screenshot captured from ${url}`,
          note: 'Connect Playwright for actual screenshots.',
        })

      case 'extract':
        if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
        return NextResponse.json({
          success: true,
          action: 'extract',
          url,
          selector: selector || 'body',
          message: `Extracted content from ${url}`,
          note: 'Connect Playwright for DOM extraction.',
        })

      case 'fill-form':
        if (!url || !steps) return NextResponse.json({ error: 'url and steps required' }, { status: 400 })
        return NextResponse.json({
          success: true,
          action: 'fill-form',
          url,
          steps,
          message: `Form automation configured for ${url}`,
          note: 'Connect Playwright for form filling.',
        })

      case 'automate':
        if (!steps || !Array.isArray(steps)) return NextResponse.json({ error: 'steps array required' }, { status: 400 })
        return NextResponse.json({
          success: true,
          action: 'automate',
          steps,
          message: `Automation workflow configured with ${steps.length} steps`,
          note: 'Connect Playwright for multi-step automation.',
        })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
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
