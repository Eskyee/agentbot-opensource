import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const MIMO_TTS_URL = 'https://token-plan-ams.xiaomimimo.com/v1/chat/completions'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has MiMo key configured (BYOK or platform key)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { byok_key_encrypted: true, byok_enabled: true, plan: true },
  })

  const hasMimoKey = Boolean(process.env.MIMO_API_KEY || process.env.MIMO_TTS_API_KEY)
  const hasBYOK = user?.byok_enabled && Boolean(user?.byok_key_encrypted)
  const ttsAvailable = hasMimoKey || hasBYOK

  // Test TTS endpoint reachability
  let ttsReachable = false
  if (hasMimoKey) {
    try {
      const res = await fetch(MIMO_TTS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MIMO_TTS_API_KEY || process.env.MIMO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mimo-v2-tts',
          messages: [{ role: 'user', content: 'test' }],
          stream: false,
        }),
        signal: AbortSignal.timeout(5000),
      })
      ttsReachable = res.ok || res.status === 400 // 400 means API is reachable
    } catch {
      ttsReachable = false
    }
  }

  return NextResponse.json({
    ttsEnabled: ttsAvailable,
    ttsReachable,
    asrEnabled: ttsAvailable,
    hasMimoKey,
    hasBYOK,
    plan: user?.plan ?? 'free',
    defaultVoice: 'mimo-tts-1',
    availableVoices: [
      { id: 'mimo-tts-1', name: 'Atlas', language: 'en-GB', gender: 'male' },
      { id: 'mimo-tts-2', name: 'Nova', language: 'en-US', gender: 'female' },
      { id: 'mimo-tts-3', name: 'Echo', language: 'en-US', gender: 'neutral' },
      { id: 'mimo-tts-4', name: 'Klave', language: 'en-GB', gender: 'male' },
      { id: 'mimo-tts-5', name: 'Raven', language: 'en-US', gender: 'female' },
    ],
    callEnabled: false,
    phoneNumber: null,
    voiceNotesEnabled: ttsAvailable,
  })
}
