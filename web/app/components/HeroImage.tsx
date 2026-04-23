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
        sizes="(max-width: 640px) 320px, (max-width: 1024px) 400px, 800px"
        className="w-full h-auto object-cover"
      />
      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}
