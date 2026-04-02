export function HeroImage() {
  return (
    <div className="relative w-full overflow-hidden border border-zinc-800">
      <img
        src="/hero-image.jpg"
        alt="Agentbot — Command Center"
        className="w-full h-auto object-cover"
        loading="eager"
      />
      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}
