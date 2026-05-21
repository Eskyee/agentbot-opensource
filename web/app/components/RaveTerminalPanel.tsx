const bars = Array.from({ length: 54 }, (_, index) => ({
  height: 18 + ((index * 23) % 68),
  delay: (index % 9) * 0.08,
}))

export function RaveTerminalPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative overflow-hidden border border-cyan-400/30 bg-black">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:linear-gradient(transparent_92%,rgba(34,211,238,.34)_93%),linear-gradient(90deg,transparent_92%,rgba(236,72,153,.2)_93%)] [background-size:100%_18px,30px_100%]" />
      <div className="relative p-4">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-3 text-[10px] uppercase tracking-widest">
          <span className="text-cyan-300">Agentbot Transmission</span>
          <span className="text-fuchsia-300">174.00 FM</span>
        </div>
        <div className={`flex items-end gap-1 ${compact ? 'h-24' : 'h-44'}`} aria-hidden="true">
          {bars.map((bar, index) => (
            <span
              key={index}
              className="w-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.5)] [animation:agentbot-wave_1.4s_ease-in-out_infinite]"
              style={{
                height: `${bar.height}%`,
                animationDelay: `${bar.delay}s`,
              }}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-xs leading-5 text-zinc-400">
          <div className="flex items-center justify-between border border-zinc-900 bg-zinc-950/80 px-3 py-2">
            <span>ARRANGEMENT_AGENT</span>
            <span className="text-cyan-300">ONLINE</span>
          </div>
          <div className="flex items-center justify-between border border-zinc-900 bg-zinc-950/80 px-3 py-2">
            <span>OPEN_GATEWAY</span>
            <span className="text-fuchsia-300">MIMO 2.5 PRO</span>
          </div>
          <div className="flex items-center justify-between border border-zinc-900 bg-zinc-950/80 px-3 py-2">
            <span>GITLAWB_PUSH</span>
            <span className="text-lime-300">SIGNED HTTP</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes agentbot-wave {
          0%, 100% { transform: scaleY(.62); opacity: .55; }
          50% { transform: scaleY(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
