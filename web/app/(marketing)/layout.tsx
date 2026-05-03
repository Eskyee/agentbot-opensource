import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot — Autonomous Agents, Verifiable State',
  description:
    'A private-cloud runtime for fleets of autonomous agents — with cryptographic identity, durable workflows, and a fact mirror you can audit down to the leaf.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="marketing-root">
      <style>{`
        /* Hide dashboard chrome on marketing page */
        header:not(.mk-top),
        nav:not(.mk-nav) { display: none !important; }

        .marketing-root {
          --mk-bg: #1a1a2e;
          --mk-bg-1: #1f1f35;
          --mk-bg-2: #252540;
          --mk-line: #3a3a50;
          --mk-line-soft: #2e2e45;
          --mk-ink: #f0f0f5;
          --mk-ink-2: #b8b8c8;
          --mk-mute: #7a7a8e;
          --mk-accent: #38bdf8;
          --mk-ok: #4ade80;
          --mk-warn: #fbbf24;
          --mk-bad: #f87171;
          --mk-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

          font-family: var(--mk-mono);
          color: var(--mk-ink);
          background: var(--mk-bg);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Scanline overlay */
        .marketing-root::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          background-image:
            linear-gradient(transparent 0, transparent calc(100% - 1px), rgba(240,240,245,0.04) 100%);
          background-size: 100% 3px;
          opacity: 0.35;
          mix-blend-mode: overlay;
        }

        /* Animations */
        @keyframes mk-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(56,189,248,0.6); }
          100% { box-shadow: 0 0 0 6px transparent; }
        }
        @keyframes mk-blink {
          50% { opacity: 0; }
        }
      `}</style>
      {children}
    </div>
  )
}
