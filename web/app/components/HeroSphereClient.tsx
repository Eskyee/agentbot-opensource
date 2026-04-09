'use client'

import dynamic from 'next/dynamic'

const MorphingHero = dynamic(() => import('@/app/components/MorphingHero'), {
  ssr: false,
  loading: () => <div className="hidden lg:block absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l from-zinc-900/20 to-transparent" />,
})

export default function HeroSphere() {
  return <MorphingHero />
}
