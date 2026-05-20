import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const sections = [
  { time: '00:00', name: 'Illegal Signal Intro', energy: 18, note: 'Shortwave noise, sub pressure fading in, one chopped vocal tag.' },
  { time: '00:32', name: 'Break Lock', energy: 42, note: 'Filtered Amen edits enter with ghost snares and vinyl grit.' },
  { time: '01:04', name: 'Reese Pressure', energy: 68, note: 'Wide Reese answers the sub while drums tighten into 16-bar phrases.' },
  { time: '01:36', name: 'First Drop', energy: 92, note: 'Full break stack, bass call-response, warehouse siren on bar 15.' },
  { time: '02:24', name: 'Emotional Breakdown', energy: 36, note: 'Pads, distant MC texture, kick removed, radio bed stays alive.' },
  { time: '03:12', name: 'Second Drop', energy: 100, note: 'Harder edits, extra ride layer, bass resample opens into the final run.' },
  { time: '04:32', name: 'Dubplate Exit', energy: 48, note: 'Strip to drums, tape delay throws, final pirate station ID.' },
]

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = asString(body.title, 'Untitled Dub').trim().slice(0, 80) || 'Untitled Dub'
  const genre = asString(body.genre, 'dark jungle').trim().slice(0, 80) || 'dark jungle'
  const mood = asString(body.mood, 'pirate radio pressure').trim().slice(0, 120) || 'pirate radio pressure'
  const bpm = Number(body.bpm) || 174

  return NextResponse.json({
    agent: 'Break Architect',
    title,
    genre,
    bpm,
    mood,
    tagline: 'Deploy AI workers. Build underground systems.',
    arrangement: sections,
    drumEvolution: [
      'Start with filtered break texture and radio static.',
      'Add chopped ghost snares before the first bass reveal.',
      'Layer ride noise and parallel crunch for the second drop.',
      'Remove low percussion during the breakdown to make the return hit harder.',
    ],
    bassProgression: [
      'Sub-only warning tone in the intro.',
      'Reese opens with slow phaser movement in the first build.',
      'Drop uses two-bar growl answers against the main sub.',
      'Second drop adds resampled mid-bass grit and tighter call-response.',
    ],
    fx: [
      'Shortwave sweep into every 32-bar marker.',
      'Reverse cymbal into first drop, tape stop before breakdown.',
      'Warehouse siren one-shot on the second-drop pickup.',
      'Dub delay throws on the final eight bars.',
    ],
  })
}
