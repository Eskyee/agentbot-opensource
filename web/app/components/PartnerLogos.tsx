'use client'

import { Cloud, Flame, Building2, Coins, Cpu, Video } from 'lucide-react'

const partners = [
  { name: 'Vercel', icon: Cloud, description: 'Edge deployment' },
  { name: 'Render', icon: Flame, description: 'Cloud hosting' },
  { name: 'Base', icon: Building2, description: 'Blockchain' },
  { name: 'Coinbase', icon: Coins, description: 'Crypto payments' },
  { name: 'OpenRouter', icon: Cpu, description: 'AI Gateway' },
  { name: 'Mux', icon: Video, description: 'Video streaming' }
]

export default function PartnerLogos() {
  return (
    <div className="mt-24 pt-12 border-t border-white/5">
      <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-12 text-center">INTEGRATED WITH THE BEST IN THE ECOSYSTEM</p>
      <div className="flex flex-wrap items-center justify-center gap-12">
        {partners.map((partner) => (
          <div 
            key={partner.name} 
            className="flex flex-col items-center gap-2 group cursor-default"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <partner.icon className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-white transition-colors">{partner.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
