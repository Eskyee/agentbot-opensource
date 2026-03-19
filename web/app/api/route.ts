import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    service: 'Agentbot API',
    docs: 'https://raveculture.mintlify.app',
    skills: [
      { endpoint: '/api/skills/visual-synthesizer', method: 'POST', description: 'Generate artwork' },
      { endpoint: '/api/skills/track-archaeologist', method: 'POST', description: 'Search catalog' },
      { endpoint: '/api/skills/setlist-oracle', method: 'POST', description: 'Build DJ sets' },
      { endpoint: '/api/skills/groupie-manager', method: 'POST', description: 'Fan CRM' },
      { endpoint: '/api/skills/royalty-tracker', method: 'POST', description: 'Track royalties' },
      { endpoint: '/api/skills/demo-submitter', method: 'POST', description: 'Submit demos' },
      { endpoint: '/api/skills/event-ticketing', method: 'POST', description: 'Sell tickets (x402 USDC)' },
      { endpoint: '/api/skills/event-scheduler', method: 'POST', description: 'Schedule events' },
      { endpoint: '/api/skills/venue-finder', method: 'POST', description: 'Find venues' },
      { endpoint: '/api/skills/festival-finder', method: 'POST', description: 'Find festivals' },
    ],
    other: [
      { endpoint: '/api/demo/chat', method: 'POST', description: 'Demo AI chat' },
      { endpoint: '/api/skills', method: 'GET', description: 'List all skills' },
    ]
  })
}
