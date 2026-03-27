import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Agentbot — Focus on the Work. Agents Handle the Rest.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a14',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow behind logo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(107,63,160,0.25) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(107,63,160,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,160,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Claw icon circle */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)',
            border: '2px solid rgba(107,63,160,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            boxShadow: '0 0 40px rgba(0,191,255,0.2), 0 0 80px rgba(107,63,160,0.15)',
          }}
        >
          <span style={{ fontSize: 80 }}>🦞</span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-3px',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          Agentbot
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#7c6fa0',
            marginBottom: 48,
            letterSpacing: '0.5px',
          }}
        >
          Focus on the Work. Agents Handle the Rest.
        </div>

        {/* Plans row */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { name: 'Solo', price: '£29/mo', glow: '#6b3fa0' },
            { name: 'Collective', price: '£69/mo', glow: '#00bfff' },
            { name: 'Label', price: '£149/mo', glow: '#8b5cf6' },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${plan.glow}50`,
                borderRadius: 10,
                padding: '10px 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: `0 0 16px ${plan.glow}20`,
              }}
            >
              <span style={{ color: plan.glow, fontSize: 15, fontWeight: 700, letterSpacing: '0.5px' }}>
                {plan.name}
              </span>
              <span style={{ color: '#ffffff', fontSize: 20, fontWeight: 800 }}>{plan.price}</span>
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            color: '#3d3d5c',
            fontSize: 15,
            letterSpacing: '1px',
          }}
        >
          agentbot.raveculture.xyz
        </div>
      </div>
    ),
    { ...size }
  )
}
