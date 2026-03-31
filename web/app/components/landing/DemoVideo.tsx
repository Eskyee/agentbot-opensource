export function DemoVideo() {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">See It In Action</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
            60 Seconds<br />
            <span className="text-zinc-700">From Zero to Live</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-4 max-w-md">
            Watch Agentbot deploy a fully autonomous agent — connected to Telegram, powered by your API key, running 24/7.
          </p>
        </div>

        <div className="relative aspect-video bg-zinc-900 border border-zinc-800 overflow-hidden">
          {/* Replace src with your actual demo video URL */}
          <iframe
            src="https://www.youtube.com/embed/VIDEO_ID_HERE"
            title="Agentbot 60-Second Demo"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
