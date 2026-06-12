/**
 * VipPass — "Built in London" conference/backstage lanyard pass.
 *
 * Pure CSS (no client JS): lanyard strap, clip, punch hole, AAA pass card
 * with barcode and serial. Tilts like it's hanging; straightens on hover.
 */
import Link from 'next/link'

export function VipPass() {
  return (
    <section className="border-t border-zinc-900 overflow-hidden">
      <div className="mx-auto grid max-w-4xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_auto]">
        {/* Copy */}
        <div>
          <div className="mb-6 inline-block border border-zinc-800 px-3 py-1 text-[10px] uppercase tracking-widest text-orange-500">
            Built in London
          </div>
          <h2 className="text-3xl font-bold uppercase leading-[0.95] tracking-tighter sm:text-4xl">
            Every agent gets<br />the <span className="text-orange-500">AAA pass.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-500">
            Designed and engineered in London for the people who run the culture — labels,
            collectives, promoters, producers. Your agent goes backstage by default: all channels,
            all skills, all hours. No guest list, no plus-one needed.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-[9px] uppercase tracking-widest text-zinc-600">
            <div><span className="text-orange-500">E1</span> Shoreditch</div>
            <div><span className="text-orange-500">GMT</span> always on</div>
            <div><span className="text-orange-500">AAA</span> clearance</div>
          </div>
        </div>

        {/* The pass */}
        <div className="group relative mx-auto w-[290px] select-none" aria-hidden>
          {/* glow */}
          <div className="absolute inset-0 translate-y-6 bg-orange-500/10 blur-3xl" />

          {/* lanyard strap */}
          <div className="relative flex justify-center">
            <div className="flex h-20 w-9 items-center justify-center overflow-hidden border-x border-zinc-800 bg-zinc-950 [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_18px,rgba(239,111,46,0.25)_18px,rgba(239,111,46,0.25)_20px)]">
              <span className="rotate-90 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-600">
                Agentbot · Agentbot
              </span>
            </div>
          </div>
          {/* clip */}
          <div className="relative z-10 mx-auto -mt-1 h-4 w-12 rounded-sm border border-zinc-700 bg-zinc-900" />
          <div className="relative z-10 mx-auto h-3 w-[3px] bg-zinc-700" />

          {/* card — hangs at a tilt, straightens on hover */}
          <div className="relative -mt-1 origin-top rotate-[-3deg] border border-zinc-800 bg-zinc-950 shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-out group-hover:rotate-0">
            {/* punch hole */}
            <div className="absolute left-1/2 top-3 h-2.5 w-9 -translate-x-1/2 rounded-full border border-zinc-800 bg-black" />

            {/* header */}
            <div className="flex items-center justify-between border-b border-zinc-900 px-5 pb-3 pt-8">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-white">Agentbot</span>
              <span className="border border-orange-500/40 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-orange-500">
                LDN 2026
              </span>
            </div>

            {/* access level */}
            <div className="border-b border-zinc-900 px-5 py-5 text-center">
              <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-600">Access</div>
              <div className="mt-1 text-4xl font-bold uppercase leading-none tracking-tighter text-orange-500">
                All areas
              </div>
            </div>

            {/* holder */}
            <div className="grid grid-cols-2 gap-px border-b border-zinc-900 bg-zinc-900">
              {[
                ['Holder', 'Your Agent'],
                ['Role', 'Autonomous'],
                ['City', 'London · E1'],
                ['Hours', '24/7/365'],
                ['Runtime', 'OpenClaw'],
                ['Clearance', 'AAA'],
              ].map(([label, value]) => (
                <div key={label} className="bg-zinc-950 px-5 py-2.5">
                  <div className="text-[8px] uppercase tracking-[0.25em] text-zinc-600">{label}</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-zinc-200">{value}</div>
                </div>
              ))}
            </div>

            {/* barcode */}
            <div className="px-5 py-4">
              <div className="h-10 w-full opacity-90 [background-image:repeating-linear-gradient(90deg,#e4e4e7_0px,#e4e4e7_2px,transparent_2px,transparent_5px,#e4e4e7_5px,#e4e4e7_6px,transparent_6px,transparent_8px,#e4e4e7_8px,#e4e4e7_11px,transparent_11px,transparent_13px)]" />
              <div className="mt-2 flex items-center justify-between text-[8px] uppercase tracking-[0.25em] text-zinc-600">
                <span>NO · LDN-∞-2026</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  Live
                </span>
              </div>
            </div>

            {/* footer */}
            <div className="border-t border-zinc-900 px-5 py-3 text-center text-[8px] uppercase tracking-[0.3em] text-zinc-700">
              Built with <span className="text-orange-500">❤️</span> in London · GMT · agentbot.sh
            </div>
          </div>
        </div>
      </div>

      <div className="sr-only">
        <Link href="/signup">Get your agent its all-areas pass — deploy on Agentbot</Link>
      </div>
    </section>
  )
}
