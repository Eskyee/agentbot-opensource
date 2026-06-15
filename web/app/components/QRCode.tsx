'use client'

import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

export function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#000000',
        },
      })
    }
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      className="border border-zinc-800"
      style={{ width: size, height: size }}
    />
  )
}
