import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Agentbot — Your 24/7 Autonomous Agent Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          fontFamily: 'monospace',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 100,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#22c55e',
              }}
            />
            <span
              style={{
                fontSize: 14,
                color: '#a1a1aa',
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              Platform Online
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: -2,
              textTransform: 'uppercase',
              margin: 0,
              textAlign: 'center',
            }}
          >
            AGENTBOT
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 24,
              color: '#71717a',
              letterSpacing: 6,
              textTransform: 'uppercase',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Your 24/7 Autonomous Agent Platform
          </p>

          {/* Stats bar */}
          <div
            style={{
              display: 'flex',
              gap: 40,
              marginTop: 48,
              padding: '16px 32px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            {[
              { label: 'AGENTS', value: '24+' },
              { label: 'CHANNELS', value: '8' },
              { label: 'UPTIME', value: '99.9%' },
              { label: 'OPEN SOURCE', value: 'YES' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 700, color: '#ffffff' }}>
                  {stat.value}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: '#52525b',
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
