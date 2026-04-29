import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const alt = 'Agentbot — Your 24/7 Autonomous Agent Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

export default async function Image() {
  const imgPath = path.join(process.cwd(), 'public', 'og-image.jpeg')
  const imgData = await readFile(imgPath)
  const base64 = `data:image/jpeg;base64,${imgData.toString('base64')}`

  return new ImageResponse(
    (
      <img
        src={base64}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ),
    { ...size }
  )
}
