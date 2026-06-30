import type { ReactNode } from 'react';

export interface Pillar {
  /** Two-digit index, e.g. "01" */
  index: string;
  /** Bold short headline, e.g. "Your own server" */
  title: string;
  /** One supporting line */
  body: string;
  /** Tailwind text-color class for the index + title hover, default orange */
  accent?: string;
}

export interface PillarsProps {
  /** Small uppercase label above the grid */
  eyebrow?: string;
  /** Optional large section heading */
  heading?: ReactNode;
  /** Exactly three differentiators — Factory-style clarity */
  pillars: [Pillar, Pillar, Pillar];
}

/**
 * Three-pillar differentiator band. Borrows Factory.ai's clarity (exactly three
 * confident claims, generous whitespace, one supporting line each) while keeping
 * Agentbot's brutalist black/orange mono brand and the established hairline grid.
 */
export function Pillars({ eyebrow, heading, pillars }: PillarsProps) {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 text-center">
            {eyebrow}
          </div>
        )}
        {heading && (
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-10 text-center">
            {heading}
          </h2>
        )}
        <div className="grid sm:grid-cols-3 gap-px bg-zinc-900 text-left">
          {pillars.map((p) => {
            const accent = p.accent ?? 'text-orange-500';
            return (
              <div key={p.index} className="bg-black p-6 sm:p-8 flex flex-col card-hover">
                <div className={`text-2xl sm:text-3xl font-bold tracking-tighter ${accent}`}>
                  {p.index}
                </div>
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-tighter mt-3 mb-4">
                  {p.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed border-t border-zinc-900 pt-4">
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
