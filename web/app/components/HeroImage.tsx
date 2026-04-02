export function HeroImage() {
  return (
    <div className="relative w-full overflow-hidden border border-zinc-800">
      <picture>
        <source
          srcSet="/hero-image-320.webp 320w, /hero-image-400.webp 400w, /hero-image.webp 800w"
          sizes="(max-width: 640px) 320px, (max-width: 1024px) 400px, 800px"
          type="image/webp"
        />
        <img
          src="/hero-image.webp"
          alt="Agentbot — Command Center"
          width={800}
          height={800}
          loading="eager"
          fetchPriority="high"
          className="w-full h-auto object-cover"
        />
      </picture>
      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}
