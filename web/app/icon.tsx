import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a14',
          borderRadius: 6,
        }}
      >
        <span style={{ fontSize: 20 }}>🦞</span>
      </div>
    ),
    { ...size }
  )
}
