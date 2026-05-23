import { NextResponse } from 'next/server'
import {
  creatorToolkitPositioning,
  marketplaceTracks,
  producerAgents,
  soundpackBlueprint,
  toolkitPrompts,
} from '@/app/lib/creator-toolkit'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    positioning: creatorToolkitPositioning,
    soundpack: soundpackBlueprint,
    producerAgents: producerAgents.map(({ id, name, role, bpm, output }) => ({ id, name, role, bpm, output })),
    prompts: toolkitPrompts.map(({ id, title, category, summary }) => ({ id, title, category, summary })),
    marketplaceTracks,
  })
}
