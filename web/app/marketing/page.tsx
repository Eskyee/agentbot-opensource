import Link from 'next/link'
import './marketing.css'
import { HeroMetrics } from './hero-metrics'

/* ── colour tokens (matching the design prototype) ─────────────── */
const c = {
  bg: '#000000',
  bg1: '#0a0a0f',
  bg2: '#111118',
  line: '#3a3a50',
  lineSoft: '#2e2e45',
  ink: '#f0f0f5',
  ink2: '#b8b8c8',
  mute: '#7a7a8e',
  accent: '#38bdf8',
  ok: '#4ade80',
  warn: '#fbbf24',
  bad: '#f87171',
} as const

/* ── Helper: reusable class for section labels ─────────────────── */
const eyeCls = 'inline-flex items-center gap-2 text-[10.5px] tracking-[0.22em] uppercase'
const sectionH =
  'font-[family-name:var(--mk-mono)] text-[clamp(28px,4vw,44px)] tracking-[-0.02em] font-medium leading-tight max-w-[24ch]'
const btnBase =
  'border px-[10px] py-[4px] text-[10.5px] tracking-[0.08em] uppercase transition-colors'
const btnPrimary = `${btnBase} border-[var(--mk-accent)] text-[var(--mk-accent)] hover:bg-[rgba(56,189,248,0.15)]`
const btnDefault = `${btnBase} border-[var(--mk-line)] text-[var(--mk-ink-2)] hover:border-[var(--mk-accent)] hover:text-[var(--mk-ink)]`
const btnBigPrimary = `${btnPrimary} text-xs px-[18px] py-[11px] tracking-[0.14em]`
const btnBig = `${btnDefault} text-xs px-[18px] py-[11px] tracking-[0.14em]`

/* ════════════════════════════════════════════════════════════════ */
export default function MarketingPage() {
  return (
    <div className="mk-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        .mk-root {
          --mk-bg: #000000; --mk-bg-1: #0a0a0f; --mk-bg-2: #111118;
          --mk-line: #3a3a50; --mk-line-soft: #2e2e45;
          --mk-ink: #f0f0f5; --mk-ink-2: #b8b8c8;
          --mk-mute: #7a7a8e; --mk-mute-2: #5a5a6e;
          --mk-accent: #38bdf8; --mk-ok: #4ade80; --mk-warn: #fbbf24; --mk-bad: #f87171;
          --mk-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
          font-family: var(--mk-mono); color: var(--mk-ink); background: var(--mk-bg);
          min-height: 100vh; overflow-x: hidden; position: relative;
        }
        .mk-root::before {
          content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 100;
          background-image: linear-gradient(transparent 0, transparent calc(100% - 1px), rgba(240,240,245,0.04) 100%);
          background-size: 100% 3px; opacity: 0.35; mix-blend-mode: overlay;
        }
        @keyframes mk-pulse { 0% { box-shadow: 0 0 0 0 rgba(56,189,248,0.6); } 100% { box-shadow: 0 0 0 6px transparent; } }
        @keyframes mk-blink { 50% { opacity: 0; } }
      `}</style>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="mk-top sticky top-0 z-10 grid items-center gap-6 border-b px-9 py-[18px] mk-header-grid"
      >
        <Link href="/" className="flex items-center gap-[10px] tracking-[0.06em]">
          <span
            className="inline-block h-[14px] w-[14px] border"
            className="mk-glyph"
          >
            <span
              className="absolute"
              className="mk-glyph-inner"
            />
          </span>
          <span className="text-xs font-semibold tracking-[0.16em]">
            AGENTBOT<span className="mk-accent">.</span>
            <span className="font-medium" className="mk-accent">
              OPS
            </span>
          </span>
        </Link>

        <nav className="mk-nav flex gap-6 text-[11px] tracking-[0.12em] uppercase">
          {['platform', 'runtime', 'proof', 'docs'].map((t) => (
            <a
              key={t}
              href={`#${t}`}
              className="transition-colors hover:text-[var(--mk-ink)]"
              className="mk-mute"
            >
              {t}
            </a>
          ))}
        </nav>

        <div className="flex gap-2">
          <Link href="/dashboard" className={btnDefault}>
            CONSOLE ▸
          </Link>
          <Link href="/signup" className={btnPrimary}>
            REQUEST ACCESS
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        className="grid gap-12 border-b px-9 pb-16 pt-20 mk-hero-grid"
      >
        {/* Left */}
        <div>
          <div className={eyeCls} className="mk-mute">
            <span className="inline-block h-[7px] w-[7px]" className="mk-dot mk-dot-accent" />
            v04 · 2026.04.30 · UTC
          </div>
          <h1
            className="mt-[18px] mb-[22px] font-[family-name:var(--mk-mono)] text-[clamp(40px,6vw,76px)] leading-[0.98] tracking-[-0.025em] font-medium"
          >
            Autonomous agents.
            <br />
            <span className="mk-accent">Verifiable</span> state.
            <br />
            Operator&#8209;grade.
          </h1>
          <p
            className="mb-7 max-w-[50ch] text-[15px] leading-[1.55]"
            className="mk-ink-2"
          >
            A private-cloud runtime for fleets of autonomous agents — with
            cryptographic identity, durable workflows, and a fact mirror you can
            audit down to the leaf.
          </p>
          <div className="flex flex-wrap gap-[10px]">
            <Link href="/dashboard" className={btnBigPrimary}>
              OPEN CONSOLE ▸
            </Link>
            <a href="#runtime" className={btnBig}>
              READ SPEC
            </a>
          </div>
          <HeroMetrics />
        </div>

        {/* Right — Mini Console */}
        <div className="self-start">
          <MiniConsole />
        </div>
      </section>

      {/* ── Strap ──────────────────────────────────────────────── */}
      <section
        className="flex flex-wrap gap-[18px] border-b px-9 py-[14px] text-[10.5px] tracking-[0.22em] uppercase"
        className="mk-card"
      >
        {['FACT-BASED BACKEND', '·', 'RAILWAY-NATIVE', '·', 'X402 GATEWAY', '·', 'DID IDENTITY', '·', 'MERKLE AUDIT', '·', 'EU · US · APAC'].map(
          (t, i) => (
            <span key={i}>{t}</span>
          ),
        )}
      </section>

      {/* ── Pillars ────────────────────────────────────────────── */}
      <section
        id="platform"
        className="border-b px-9 py-20"
        className="mk-border"
      >
        <div className={eyeCls} className="mk-accent">
          <span>▸</span> PLATFORM
        </div>
        <h2 className={`${sectionH} mt-[10px] mb-9`}>
          Three layers, one runtime.
        </h2>
        <div
          className="grid border"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: c.line,
            borderColor: c.line,
          }}
        >
          {[
            {
              no: '01',
              title: 'Identity',
              desc: 'Every agent is a DID. Every call is signed. SignatureGuard enforces auth at every boundary — not as middleware you can bypass.',
              tags: ['did:key', 'ed25519', 'auto-rotation'],
            },
            {
              no: '02',
              title: 'Execution',
              desc: 'Durable workflows that survive restarts, region failover, and key rotation. Replay any run from intake to commit.',
              tags: ['workflows', 'sandboxed skills', 'retry policies'],
            },
            {
              no: '03',
              title: 'State',
              desc: 'Facts mirrored to Gitlawb with Merkle proofs. Every commit is verifiable. Every read is cached. Every leaf is yours.',
              tags: ['fact mirror', 'merkle proofs', 'p95 41ms'],
            },
          ].map((p) => (
            <article
              key={p.no}
              className="flex flex-col gap-[10px] p-[32px_28px]"
              className="mk-bg"
            >
              <div
                className="text-[10.5px] tracking-[0.18em]"
                className="mk-mute"
              >
                {p.no}
              </div>
              <h3
                className="text-xl font-medium tracking-[-0.01em]"
                className="mk-ink"
              >
                {p.title}
              </h3>
              <p
                className="text-[13px] leading-[1.55] max-w-[38ch]"
                className="mk-ink-2"
              >
                {p.desc}
              </p>
              <div
                className="mt-[10px] flex flex-wrap gap-2 text-[10px] tracking-[0.14em] uppercase"
                className="mk-mute"
              >
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Runtime Spec ────────────────────────────────────────── */}
      <section
        id="runtime"
        className="grid gap-[60px] border-b px-9 py-20"
        style={{ gridTemplateColumns: '1fr 1fr', borderColor: c.line }}
      >
        <div>
          <div className={eyeCls} className="mk-accent">
            <span>▸</span> RUNTIME
          </div>
          <h2 className={`${sectionH} mt-[10px] mb-9`}>
            Built for operators, not demos.
          </h2>
          <p
            className="max-w-[46ch] text-sm leading-[1.55]"
            className="mk-ink-2"
          >
            The console is the product. Watch fleets in real time, scrub workflow
            timelines, verify facts against root, decommission a node without
            orphaning state. Every action leaves an auditable trace.
          </p>
          <ul className="mt-[22px] flex flex-col gap-[10px]">
            {[
              { b: 'Pause & drain', t: 'flush queues before you stop a node.' },
              { b: 'Quarantine', t: 'isolate flagged regions without halting the fleet.' },
              { b: 'Promote standby', t: 'warm a cold region in under 4 seconds.' },
              { b: 'Replay', t: 're-run any workflow against current policy.' },
            ].map((f) => (
              <li
                key={f.b}
                className="grid items-baseline text-[12.5px]"
                style={{
                  gridTemplateColumns: '16px 1fr',
                  gap: 10,
                  color: c.ink2,
                }}
              >
                <span
                  className="mt-[5px] inline-block h-2 w-2"
                  className="mk-dot mk-dot-accent"
                />
                <span>
                  <span className="font-medium" className="mk-ink">
                    {f.b}
                  </span>{' '}
                  — {f.t}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <table
            className="w-full border-collapse border text-[12.5px]"
            className="mk-card"
          >
            <thead>
              <tr>
                {['component', 'spec'].map((h) => (
                  <th
                    key={h}
                    className="border-b px-4 py-3 text-left font-normal text-[9.5px] tracking-[0.18em] uppercase"
                    className="mk-spec-row"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['identity', 'did:key · ed25519 · 14d rotation'],
                ['workflow', 'durable · cancel-safe · replayable'],
                ['model', 'mimo-v2.5-pro · gateway-pinned'],
                ['state', 'SQL + gitlawb mirror · merkle'],
                ['cache', 'centralized redis · 41ms p95'],
                ['regions', 'iad · fra · lhr · sin · syd'],
                ['license', 'MIT · open core'],
              ].map(([k, v], i, arr) => (
                <tr key={k}>
                  <td
                    className="px-4 py-[11px]"
                    style={{
                      color: c.mute,
                      borderBottom:
                        i < arr.length - 1
                          ? `1px dashed ${c.lineSoft}`
                          : 'none',
                    }}
                  >
                    {k}
                  </td>
                  <td
                    className="px-4 py-[11px]"
                    style={{
                      color: c.ink2,
                      borderBottom:
                        i < arr.length - 1
                          ? `1px dashed ${c.lineSoft}`
                          : 'none',
                    }}
                  >
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Proof ──────────────────────────────────────────────── */}
      <section
        id="proof"
        className="border-b px-9 py-20"
        className="mk-border"
      >
        <div className={eyeCls} className="mk-accent">
          <span>▸</span> PROOF
        </div>
        <h2 className={`${sectionH} mt-[10px] mb-9`}>
          Verify, don&apos;t trust.
        </h2>
        <div
          className="grid border"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: c.line,
            borderColor: c.line,
          }}
        >
          {/* Card 1 */}
          <div className="p-[18px]" className="mk-bg-1">
            <pre
              className="m-0 whitespace-pre-wrap font-[family-name:var(--mk-mono)] text-[11.5px] leading-[1.5]"
              className="mk-ink-2"
            >
              {`$ agentbot fact verify tx/L-7f3a…`}
              {'\n'}
              <span className="mk-accent">→</span>
              {' leaf  0x9c1f…ae72\n'}
              <span className="mk-accent">→</span>
              {' proof 3 sibling hashes\n'}
              <span className="mk-accent">→</span>
              {' root  0xaa61…f1e0\n'}
              <span className="mk-ok">✓ verified</span>
              {'  signed by did:key:z6Mk…1F2a'}
            </pre>
          </div>
          {/* Card 2 */}
          <div className="p-[18px]" className="mk-bg-1">
            <pre
              className="m-0 whitespace-pre-wrap font-[family-name:var(--mk-mono)] text-[11.5px] leading-[1.5]"
              className="mk-ink-2"
            >
              {`$ agentbot node pause settler-12 --drain`}
              {'\n'}
              <span className="mk-accent">draining…</span>
              {' 11 → 6 → 2 → 0\n'}
              <span className="mk-ok">paused</span>
              {' facts committed=11  open=0\n'}
              {'       state=parked  resume=safe'}
            </pre>
          </div>
          {/* Card 3 */}
          <div className="p-[18px]" className="mk-bg-1">
            <pre
              className="m-0 whitespace-pre-wrap font-[family-name:var(--mk-mono)] text-[11.5px] leading-[1.5]"
              className="mk-ink-2"
            >
              {`$ agentbot audit tail --since 1m\n14:08:21z  scout-04     intake.signed  ok\n14:08:22z  settler-12   tool.call      ok\n14:08:23z  courier-22   advisory      `}
              <span className="mk-warn">mem 92%</span>
              {'\n14:08:24z  auditor-07   verify         ok'}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────── */}
      <section
        className="border-b px-9 py-20 text-left"
        className="mk-border"
      >
        <h2
          className="font-[family-name:var(--mk-mono)] text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.02em] mb-3"
        >
          Open the console.
        </h2>
        <p className="mb-7 text-sm" className="mk-ink-2">
          Bring your DIDs, your skills, your policies. Or start with the
          archetypes.
        </p>
        <div className="flex flex-wrap gap-[10px]">
          <Link href="/dashboard" className={btnBigPrimary}>
            OPEN CONSOLE ▸
          </Link>
          <Link href="/dashboard/ops" className={btnBig}>
            SEE FLEET CONTROL
          </Link>
          <Link href="/dashboard/ops" className={btnBig}>
            TRY THE COACH
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        className="flex items-center justify-between px-9 py-[22px] text-[10.5px] tracking-[0.06em]"
        className="mk-mute"
      >
        <div>
          <span
            className="mr-2 tracking-[0.18em]"
            className="mk-ink-2"
          >
            AGENTBOT
            <span className="font-medium" className="mk-accent">
              .OPS
            </span>
          </span>
          <span className="mk-mute">
            — autonomous agents, verifiable state.
          </span>
        </div>
        <div>v04 · 2026.04.30 · MIT</div>
      </footer>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════ */
/* Mini Console component                                           */
/* ════════════════════════════════════════════════════════════════ */
function MiniConsole() {
  const lines = [
    { t: '00:00.000', status: 'ok', label: 'intake.signed', ms: '12ms' },
    { t: '00:00.040', status: 'ok', label: 'skill.resolve liquid.swap@2.1.0', ms: '19ms' },
    { t: '00:00.065', status: 'ok', label: 'model.invoke mimo-v2.5-pro', ms: '184ms' },
    { t: '00:00.249', status: 'ok', label: 'tool.call bridge.x402', ms: '311ms' },
    { t: '00:00.560', status: 'warn', label: 'tool.call liquid.swap · slip 0.05%', ms: '870ms' },
    { t: '00:01.430', status: 'live', label: 'state.commit · mirror queued', ms: '…' },
  ]

  return (
    <div
      className="border font-[family-name:var(--mk-mono)] text-xs"
      className="mk-console"
    >
      {/* Bar */}
      <div
        className="flex items-center gap-[6px] border-b px-[14px] py-2 text-[10.5px] tracking-[0.04em]"
        className="mk-card-dark"
      >
        <span className="inline-block h-[9px] w-[9px] border" className="mk-border" />
        <span className="inline-block h-[9px] w-[9px] border" className="mk-border" />
        <span className="inline-block h-[9px] w-[9px] border" className="mk-border" />
        <span className="ml-[10px]">
          agentbot — settler-12 — wf_swap_0214
        </span>
      </div>

      {/* Body */}
      <div className="px-0 py-[10px]">
        {lines.map((l) => (
          <div
            key={l.t}
            className="grid items-baseline border-b px-[14px] py-[5px] text-[11.5px]"
            style={{
              gridTemplateColumns: '70px 16px 1fr 60px',
              gap: 10,
              borderBottomStyle: 'dashed',
              borderColor: c.lineSoft,
              ...(l.status === 'warn'
                ? { background: 'rgba(251,191,36,0.05)' }
                : l.status === 'live'
                  ? { background: 'rgba(56,189,248,0.06)' }
                  : {}),
            }}
          >
            <span className="text-[10.5px]" className="mk-mute">
              {l.t}
            </span>
            <span
              className="inline-block h-2 w-2"
              style={{
                background:
                  l.status === 'ok'
                    ? c.ok
                    : l.status === 'warn'
                      ? c.warn
                      : c.accent,
                ...(l.status === 'live'
                  ? { animation: 'mk-pulse 1.6s ease-out infinite' }
                  : {}),
              }}
            />
            <span>
              {l.label}
              {l.status === 'live' && (
                <span
                  className="ml-1"
                  style={{
                    color: c.accent,
                    animation: 'mk-blink 1s step-end infinite',
                  }}
                >
                  ▌
                </span>
              )}
            </span>
            <span
              className="text-right text-[10.5px] tabular-nums"
              className="mk-ink-2"
            >
              {l.ms}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex gap-[10px] border-t px-[14px] py-2 text-[10.5px]"
        className="mk-card-dark"
      >
        <span>
          SignatureGuard{' '}
          <span className="mk-ok">✓</span>
        </span>
        <span>·</span>
        <span>leaf 0x9c1f…ae72</span>
        <span>·</span>
        <span>seq 00214</span>
      </div>
    </div>
  )
}
