import { NextResponse } from 'next/server'

export function rejectDemoRouteInProduction(routeName: string) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_SKILLS !== 'true') {
    return NextResponse.json(
      {
        error: 'disabled_in_production',
        message: `${routeName} is a demo route and is disabled in production.`,
      },
      { status: 501 }
    )
  }

  return null
}

