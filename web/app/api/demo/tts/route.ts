import { NextRequest, NextResponse } from 'next/server'

const MIMO_TTS_URL = 'https://token-plan-ams.xiaomimimo.com/v1/chat/completions'
const MIMO_KEY = process.env.MIMO_TTS_API_KEY || process.env.MIMO_API_KEY || ''
const MAX_TTS_CHARS = 2000

const ATLAS_STYLE = `You are Atlas, a confident British male Chief of Staff. Speak directly and authoritatively. No filler words. Concise and clear.`

export async function POST(request: NextRequest) {
  if (!MIMO_KEY) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const text = (body.text as string || '').trim()

  if (!text || text.length > MAX_TTS_CHARS) {
    return NextResponse.json({ error: `Text required (max ${MAX_TTS_CHARS} chars)` }, { status: 400 })
  }

  try {
    const res = await fetch(MIMO_TTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MIMO_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mimo-v2-tts',
        messages: [
          { role: 'user', content: ATLAS_STYLE },
          { role: 'assistant', content: text },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[TTS] MiMo error:', res.status, err)
      return NextResponse.json({ error: 'TTS service unavailable' }, { status: 502 })
    }

    const data = await res.json()
    const audioB64 = data.choices?.[0]?.message?.audio?.data

    if (!audioB64) {
      console.error('[TTS] No audio data in response')
      return NextResponse.json({ error: 'No audio generated' }, { status: 502 })
    }

    // Decode base64 PCM (48kHz, 16-bit, mono) and wrap in WAV header
    const pcm = Buffer.from(audioB64, 'base64')
    const wav = pcmToWav(pcm, 48000, 16, 1)

    return new NextResponse(new Uint8Array(wav), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error('[TTS] Request failed:', err)
    return NextResponse.json({ error: 'TTS unavailable' }, { status: 502 })
  }
}

function pcmToWav(pcm: Buffer, sampleRate: number, bitsPerSample: number, channels: number): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8
  const blockAlign = (channels * bitsPerSample) / 8
  const dataSize = pcm.length
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // chunk size
  header.writeUInt16LE(1, 20)  // PCM format
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcm])
}
