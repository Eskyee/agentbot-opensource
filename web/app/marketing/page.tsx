import Link from 'next/link'
import './marketing.css'

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
        className="mk-top sticky top-0 z-10 grid items-center gap-6 border-b px-9 py-[18px]"
        style={{
          gridTemplateColumns: 'auto 1fr auto',
          borderColor: c.line,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Link href="/" className="flex items-center gap-[10px] tracking-[0.06em]">
          <span
            className="inline-block h-[14px] w-[14px] border"
            style={{ borderColor: c.accent, position: 'relative' }}
          >
            <span
              className="absolute"
              style={{ inset: 2, background: c.accent }}
            />
          </span>
          <span className="text-xs font-semibold tracking-[0.16em]">
            AGENTBOT<span style={{ color: c.accent }}>.</span>
            <span className="font-medium" style={{ color: c.accent }}>
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
              style={{ color: c.mute }}
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
        className="grid gap-12 border-b px-9 pb-16 pt-20"
        style={{
          gridTemplateColumns: '1.05fr 1fr',
          borderColor: c.line,
          backgroundImage: `
            linear-gradient(transparent 0, transparent calc(100% - 1px), ${c.lineSoft} 100%),
            linear-gradient(90deg, transparent 0, transparent calc(100% - 1px), ${c.lineSoft} 100%)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0',
          backgroundColor: c.bg,
        }}
      >
        {/* Left */}
        <div>
          <div className={eyeCls} style={{ color: c.mute }}>
            <span className="inline-block h-[7px] w-[7px]" style={{ background: c.accent }} />
            v04 · 2026.04.30 · UTC
          </div>
          <h1
            className="mt-[18px] mb-[22px] font-[family-name:var(--mk-mono)] text-[clamp(40px,6vw,76px)] leading-[0.98] tracking-[-0.025em] font-medium"
          >
            Autonomous agents.
            <br />
            <span style={{ color: c.accent }}>Verifiable</span> state.
            <br />
            Operator&#8209;grade.
          </h1>
          <p
            className="mb-7 max-w-[50ch] text-[15px] leading-[1.55]"
            style={{ color: c.ink2 }}
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
          <div
            className="mt-11 grid grid-cols-4 border"
            style={{ background: c.line, borderColor: c.line, gap: 1 }}
          >
            {[
              { v: '24', k: 'fleet · prod' },
              { v: '98.6%', k: 'verified facts' },
              { v: '312ms', k: 'p95 inference' },
              { v: '41ms', k: 'mirror lag' },
            ].map((m) => (
              <div
                key={m.k}
                className="flex flex-col gap-[2px] p-[14px_16px]"
                style={{ background: c.bg }}
              >
                <b
                  className="text-xl font-medium tabular-nums"
                  style={{ color: c.ink }}
                >
                  {m.v}
                </b>
                <span
                  className="text-[9.5px] tracking-[0.18em] uppercase"
                  style={{ color: c.mute }}
                >
                  {m.k}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Mini Console */}
        <div className="self-start">
          <MiniConsole />
        </div>
      </section>

      {/* ── Strap ──────────────────────────────────────────────── */}
      <section
        className="flex flex-wrap gap-[18px] border-b px-9 py-[14px] text-[10.5px] tracking-[0.22em] uppercase"
        style={{ borderColor: c.line, background: c.bg1, color: c.mute }}
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
        style={{ borderColor: c.line }}
      >
        <div className={eyeCls} style={{ color: c.accent }}>
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
              style={{ background: c.bg }}
            >
              <div
                className="text-[10.5px] tracking-[0.18em]"
                style={{ color: c.mute }}
              >
                {p.no}
              </div>
              <h3
                className="text-xl font-medium tracking-[-0.01em]"
                style={{ color: c.ink }}
              >
                {p.title}
              </h3>
              <p
                className="text-[13px] leading-[1.55] max-w-[38ch]"
                style={{ color: c.ink2 }}
              >
                {p.desc}
              </p>
              <div
                className="mt-[10px] flex flex-wrap gap-2 text-[10px] tracking-[0.14em] uppercase"
                style={{ color: c.mute }}
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
          <div className={eyeCls} style={{ color: c.accent }}>
            <span>▸</span> RUNTIME
          </div>
          <h2 className={`${sectionH} mt-[10px] mb-9`}>
            Built for operators, not demos.
          </h2>
          <p
            className="max-w-[46ch] text-sm leading-[1.55]"
            style={{ color: c.ink2 }}
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
                  style={{ background: c.accent }}
                />
                <span>
                  <span className="font-medium" style={{ color: c.ink }}>
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
            style={{ borderColor: c.line, background: c.bg1 }}
          >
            <thead>
              <tr>
                {['component', 'spec'].map((h) => (
                  <th
                    key={h}
                    className="border-b px-4 py-3 text-left font-normal text-[9.5px] tracking-[0.18em] uppercase"
                    style={{ borderColor: c.line, color: c.mute }}
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
                ['model', 'mimo-v2-pro · gateway-pinned'],
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
        style={{ borderColor: c.line }}
      >
        <div className={eyeCls} style={{ color: c.accent }}>
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
          <div className="p-[18px]" style={{ background: c.bg1 }}>
            <pre
              className="m-0 whitespace-pre-wrap font-[family-name:var(--mk-mono)] text-[11.5px] leading-[1.5]"
              style={{ color: c.ink2 }}
            >
              {`$ agentbot fact verify tx/L-7f3a…`}
              {'\n'}
              <span style={{ color: c.accent }}>→</span>
              {' leaf  0x9c1f…ae72\n'}
              <span style={{ color: c.accent }}>→</span>
              {' proof 3 sibling hashes\n'}
              <span style={{ color: c.accent }}>→</span>
              {' root  0xaa61…f1e0\n'}
              <span style={{ color: c.ok }}>✓ verified</span>
              {'  signed by did:key:z6Mk…1F2a'}
            </pre>
          </div>
          {/* Card 2 */}
          <div className="p-[18px]" style={{ background: c.bg1 }}>
            <pre
              className="m-0 whitespace-pre-wrap font-[family-name:var(--mk-mono)] text-[11.5px] leading-[1.5]"
              style={{ color: c.ink2 }}
            >
              {`$ agentbot node pause settler-12 --drain`}
              {'\n'}
              <span style={{ color: c.accent }}>draining…</span>
              {' 11 → 6 → 2 → 0\n'}
              <span style={{ color: c.ok }}>paused</span>
              {' facts committed=11  open=0\n'}
              {'       state=parked  resume=safe'}
            </pre>
          </div>
          {/* Card 3 */}
          <div className="p-[18px]" style={{ background: c.bg1 }}>
            <pre
              className="m-0 whitespace-pre-wrap font-[family-name:var(--mk-mono)] text-[11.5px] leading-[1.5]"
              style={{ color: c.ink2 }}
            >
              {`$ agentbot audit tail --since 1m\n14:08:21z  scout-04     intake.signed  ok\n14:08:22z  settler-12   tool.call      ok\n14:08:23z  courier-22   advisory      `}
              <span style={{ color: c.warn }}>mem 92%</span>
              {'\n14:08:24z  auditor-07   verify         ok'}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────── */}
      <section
        className="border-b px-9 py-20 text-left"
        style={{ borderColor: c.line }}
      >
        <h2
          className="font-[family-name:var(--mk-mono)] text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.02em] mb-3"
        >
          Open the console.
        </h2>
        <p className="mb-7 text-sm" style={{ color: c.ink2 }}>
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
        style={{ color: c.mute }}
      >
        <div>
          <span
            className="mr-2 tracking-[0.18em]"
            style={{ color: c.ink2 }}
          >
            AGENTBOT
            <span className="font-medium" style={{ color: c.accent }}>
              .OPS
            </span>
          </span>
          <span style={{ color: c.mute }}>
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
    { t: '00:00.065', status: 'ok', label: 'model.invoke mimo-v2-pro', ms: '184ms' },
    { t: '00:00.249', status: 'ok', label: 'tool.call bridge.x402', ms: '311ms' },
    { t: '00:00.560', status: 'warn', label: 'tool.call liquid.swap · slip 0.05%', ms: '870ms' },
    { t: '00:01.430', status: 'live', label: 'state.commit · mirror queued', ms: '…' },
  ]

  return (
    <div
      className="border font-[family-name:var(--mk-mono)] text-xs"
      style={{
        borderColor: c.line,
        background: c.bg1,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}
    >
      {/* Bar */}
      <div
        className="flex items-center gap-[6px] border-b px-[14px] py-2 text-[10.5px] tracking-[0.04em]"
        style={{ borderColor: c.line, background: c.bg2, color: c.mute }}
      >
        <span className="inline-block h-[9px] w-[9px] border" style={{ borderColor: c.line }} />
        <span className="inline-block h-[9px] w-[9px] border" style={{ borderColor: c.line }} />
        <span className="inline-block h-[9px] w-[9px] border" style={{ borderColor: c.line }} />
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
            <span className="text-[10.5px]" style={{ color: c.mute }}>
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
              style={{ color: c.ink2 }}
            >
              {l.ms}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex gap-[10px] border-t px-[14px] py-2 text-[10.5px]"
        style={{ borderColor: c.line, background: c.bg2, color: c.mute }}
      >
        <span>
          SignatureGuard{' '}
          <span style={{ color: c.ok }}>✓</span>
        </span>
        <span>·</span>
        <span>leaf 0x9c1f…ae72</span>
        <span>·</span>
        <span>seq 00214</span>
      </div>
    </div>
  )
}
