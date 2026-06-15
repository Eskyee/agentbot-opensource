import Image from 'next/image'

export function HeroImage() {
  return (
    <div className="relative w-full overflow-hidden border border-zinc-800">
      <Image
        src="/hero-image.webp"
        alt="Agentbot — Command Center"
        width={800}
        height={800}
        priority
        sizes="(max-width: 768px) 100vw, 768px"
        className="w-full h-auto object-cover"
      />
      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}
