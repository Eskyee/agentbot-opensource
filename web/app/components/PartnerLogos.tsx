'use client'

import { useState, useEffect } from 'react'

const partners = [
  { name: 'Vercel', logo: 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png' },
  { name: 'Render', logo: 'https://render.com/images/logo-render-dark.svg' },
  { name: 'Base', logo: 'https://images.ctfassets.net/q5ulk4u67rws/6p6p2p6p6p2p6p6p2p6p6p/6p6p2p6p6p2p6p6p2p6p6p/Base_Wordmark_Blue.png' },
  { name: 'Coinbase', logo: 'https://images.ctfassets.net/q5ulk4u67rws/4p4p4p4p4p4p4p4p4p4p4p/4p4p4p4p4p4p4p4p4p4p4p/Coinbase_Wordmark_Blue.png' },
  { name: 'Ollama', logo: 'https://ollama.com/public/ollama.png' },
  { name: 'Mux', logo: 'https://www.mux.com/assets/img/mux-logo.svg' }
]

export default function PartnerLogos() {
  return (
    <div className="mt-24 pt-12 border-t border-white/5">
      <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-12 text-center">INTEGRATED WITH THE BEST IN THE ECOSYSTEM</p>
      <div className="flex flex-wrap items-center justify-center gap-16">
        {partners.map((partner) => (
          <div key={partner.name} className="h-8 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {/* Using text representation for now to ensure stability, but formatted as logos */}
            <span className="font-black text-2xl tracking-tighter">{partner.name.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
