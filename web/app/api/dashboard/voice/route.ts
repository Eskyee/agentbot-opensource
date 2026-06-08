import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Voice config — MiMo TTS/ASR status
  return NextResponse.json({
    ttsEnabled: true,
    asrEnabled: true,
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
    voiceNotesEnabled: true,
  })
}
