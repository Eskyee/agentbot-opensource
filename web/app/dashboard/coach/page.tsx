'use client';

import { useState } from 'react';
import { DashboardShell, DashboardHeader } from '@/app/components/shared/DashboardShell';

/* ── Lesson data ─────────────────────────────────────────────── */
interface CheckItem {
  label: string;
  done: boolean;
}

interface Lesson {
  id: string;
  num: string;
  title: string;
  estimatedMin: number;
  concept: { heading: string; body: string };
  terminal: { cmd: string; output: string[] };
  hint: string;
  checks: CheckItem[];
  practiceNode: {
    name: string;
    tag: string;
    did: string;
    region: string;
    cpu: number;
    p50: number;
    fitness: number;
    score: { label: string; value: string; accent?: boolean }[];
    nextUp: string[];
  };
}

const LESSONS: Lesson[] = [
  {
    id: 'deploy',
    num: '01',
    title: 'Deploy your first agent',
    estimatedMin: 4,
    concept: {
      heading: 'Provisioning',
      body: 'An agent is an autonomous process with a <b>DID</b>, a <b>skill set</b>, and a <b>fact mirror</b>. When you deploy one, agentbot provisions a container, generates an ed25519 keypair, and registers the DID on-chain. The agent is live before you finish reading this.',
    },
    terminal: {
      cmd: 'agentbot deploy --name settler-01 --region fra-1',
      output: [
        '→ generating keypair…          ok',
        '→ registering did:key:z6Mk…    ok',
        '→ provisioning container…      ok',
        '→ health check…',
        '✓ agent live   settler-01  fra-1',
      ],
    },
    hint: 'Pick a region close to your primary data source. Latency compounds.',
    checks: [
      { label: 'Agent deployed', done: false },
      { label: 'DID generated', done: false },
      { label: 'Health check passed', done: false },
      { label: 'Console shows RUNNING', done: false },
    ],
    practiceNode: {
      name: 'settler-01',
      tag: 'DEPLOY',
      did: 'did:key:z6Mk…1F2a',
      region: 'fra-1',
      cpu: 12,
      p50: 44,
      fitness: 62,
      score: [
        { label: 'Deploy time', value: '3.2s', accent: true },
        { label: 'Region', value: 'fra-1' },
        { label: 'Health', value: 'ok', accent: true },
      ],
      nextUp: ['Configure identity', 'Enable skills'],
    },
  },
  {
    id: 'identity',
    num: '02',
    title: 'Configure identity',
    estimatedMin: 6,
    concept: {
      heading: 'Identity anchors',
      body: "Every agent is a <b>DID</b> — a cryptographic identifier that can sign, rotate, and verify. <b>SignatureGuard</b> enforces auth at every boundary. There is no middleware you can bypass. Your agent's identity is its contract with every system it touches.",
    },
    terminal: {
      cmd: 'agentbot did show settler-12',
      output: [
        '→ did:key:z6Mk…1F2a',
        '   algo      ed25519',
        '   issued    2026-04-19 · 14:08:21z',
        '   last sig  14ms ago',
        '   guard     SignatureGuard ✓',
        '   rotation  in 14d · auto',
      ],
    },
    hint: 'Enable auto-rotation. Manual key rotation is how incidents happen.',
    checks: [
      { label: 'DID generated', done: false },
      { label: 'SignatureGuard wired', done: false },
      { label: 'Key rotation set to auto', done: false },
      { label: 'Leaf committed to mirror', done: false },
    ],
    practiceNode: {
      name: 'courier-22',
      tag: 'IDENTITY',
      did: 'did:key:z6Mk…2c9b',
      region: 'iad-1',
      cpu: 38,
      p50: 71,
      fitness: 78,
      score: [
        { label: 'Sig latency', value: '14ms', accent: true },
        { label: 'Rotation', value: 'auto' },
        { label: 'Guard', value: '✓ ok', accent: true },
      ],
      nextUp: ['Enable skills', 'Run a workflow'],
    },
  },
  {
    id: 'skills',
    num: '03',
    title: 'Enable skills',
    estimatedMin: 5,
    concept: {
      heading: 'Skills & sandboxing',
      body: 'Skills are <b>sandboxed tool modules</b> your agent can call. They run in isolated environments with explicit permission scopes. Install only what you need. Every skill call is logged, audited, and rate-limited by your plan.',
    },
    terminal: {
      cmd: 'agentbot skill install liquid.swap@2.1.0 --agent settler-12',
      output: [
        '→ resolving liquid.swap@2.1.0…  ok',
        '→ sandbox iad-1…                ok',
        '→ scope  [read:balance write:tx]',
        '→ policy p_swap_v3  4 rules · 0 deny',
        '✓ skill active  liquid.swap@2.1.0',
      ],
    },
    hint: 'Review the scope before installing. "write:*" is almost never the right choice.',
    checks: [
      { label: 'Skill installed', done: false },
      { label: 'Scope reviewed', done: false },
      { label: 'Policy rules verified', done: false },
      { label: 'Test call succeeded', done: false },
    ],
    practiceNode: {
      name: 'smith-14',
      tag: 'SKILLS',
      did: 'did:key:z6Mk…7a3d',
      region: 'fra-1',
      cpu: 54,
      p50: 112,
      fitness: 71,
      score: [
        { label: 'Skills active', value: '3', accent: true },
        { label: 'Calls / 24h', value: '1,284' },
        { label: 'Policy', value: '4 rules', accent: false },
      ],
      nextUp: ['Run a workflow', 'Audit & verify'],
    },
  },
  {
    id: 'workflow',
    num: '04',
    title: 'Run a workflow',
    estimatedMin: 7,
    concept: {
      heading: 'Durable workflows',
      body: 'Workflows are <b>durable execution graphs</b> that survive restarts, key rotation, and region failover. Each step is committed to the fact mirror before moving on. You can replay any run from intake to commit — the audit trail is immutable.',
    },
    terminal: {
      cmd: 'agentbot workflow run wf_swap --agent settler-12 --watch',
      output: [
        '00:00.000  intake.signed    ok    12ms',
        '00:00.040  skill.resolve    ok    19ms',
        '00:00.065  model.invoke     ok   184ms',
        '00:00.249  tool.call        ok   311ms',
        '00:00.560  tool.call        warn  870ms  slip 0.05%',
        '00:01.430  state.commit     …',
      ],
    },
    hint: 'Set a slip tolerance in your policy. Unconstrained swaps are how you lose money.',
    checks: [
      { label: 'Workflow triggered', done: false },
      { label: 'All steps completed', done: false },
      { label: 'Facts committed', done: false },
      { label: 'Run visible in audit trail', done: false },
    ],
    practiceNode: {
      name: 'auditor-07',
      tag: 'WORKFLOW',
      did: 'did:key:z6Mk…9f1c',
      region: 'fra-1',
      cpu: 29,
      p50: 88,
      fitness: 85,
      score: [
        { label: 'Runs / 24h', value: '214', accent: true },
        { label: 'Success rate', value: '99.1%' },
        { label: 'p95 dur', value: '2.18s', accent: false },
      ],
      nextUp: ['Audit & verify', 'Scale your fleet'],
    },
  },
  {
    id: 'audit',
    num: '05',
    title: 'Audit & verify',
    estimatedMin: 6,
    concept: {
      heading: 'Merkle proofs',
      body: "Every fact your agent commits is part of a <b>Merkle tree</b> mirrored to Gitlawb. You can verify any leaf — a transaction, a balance, a policy decision — against the root hash. Verification takes 14ms. Auditing is not an afterthought; it's the product.",
    },
    terminal: {
      cmd: 'agentbot fact verify tx/L-7f3a…',
      output: [
        '→ leaf   0x9c1f…ae72',
        '→ proof  3 sibling hashes',
        '→ root   0xaa61…f1e0',
        '✓ verified  signed by did:key:z6Mk…1F2a',
      ],
    },
    hint: 'Spot-check leaves regularly. An anomalous hash is an incident in waiting.',
    checks: [
      { label: 'Fact tree visible', done: false },
      { label: 'Leaf verified against root', done: false },
      { label: 'Proof chain valid', done: false },
      { label: 'Audit trail reviewed', done: false },
    ],
    practiceNode: {
      name: 'lighthouse-01',
      tag: 'AUDIT',
      did: 'did:key:z6Mk…3b2e',
      region: 'lhr-1',
      cpu: 9,
      p50: 41,
      fitness: 92,
      score: [
        { label: 'Facts verified', value: '2,148', accent: true },
        { label: 'Avg verify', value: '14ms', accent: true },
        { label: 'Root match', value: '✓ ok' },
      ],
      nextUp: ['Scale your fleet'],
    },
  },
  {
    id: 'scale',
    num: '06',
    title: 'Scale your fleet',
    estimatedMin: 8,
    concept: {
      heading: 'Fleet operations',
      body: "Scaling is not just adding nodes — it's <b>distributing policy</b>, <b>syncing fact mirrors</b>, and maintaining sub-100ms identity verification across regions. Agentbot handles region failover automatically. You manage the policies and the budget.",
    },
    terminal: {
      cmd: 'agentbot fleet scale --region fra-1 --count 3',
      output: [
        '→ cloning settler-12 config…   ok',
        '→ provisioning settler-13…     ok',
        '→ provisioning settler-14…     ok',
        '→ syncing fact mirrors…        ok',
        '✓ fleet  fra-1  3 nodes  RUNNING',
      ],
    },
    hint: 'Clone an agent you trust. Bootstrapping from scratch in prod is chaos.',
    checks: [
      { label: 'Nodes spawned', done: false },
      { label: 'Fact mirrors synced', done: false },
      { label: 'Policy distributed', done: false },
      { label: 'Fleet dashboard green', done: false },
    ],
    practiceNode: {
      name: 'midwife-18',
      tag: 'SCALE',
      did: 'did:key:z6Mk…4d8f',
      region: 'fra-1',
      cpu: 67,
      p50: 95,
      fitness: 74,
      score: [
        { label: 'Fleet size', value: '8 nodes', accent: true },
        { label: 'Regions', value: '3' },
        { label: 'Mirror lag', value: '41ms', accent: false },
      ],
      nextUp: ['Master complete ✓'],
    },
  },
];

/* ── Progress tracking in local state ───────────────────────── */
function useCoachState() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [checkState, setCheckState] = useState<Record<string, boolean[]>>(() =>
    Object.fromEntries(LESSONS.map((l) => [l.id, l.checks.map((c) => c.done)]))
  );

  const lesson = LESSONS[currentIdx];
  const checks = checkState[lesson.id] ?? [];
  const completedCount = checks.filter(Boolean).length;
  const totalChecks = LESSONS.reduce((s, l) => s + l.checks.length, 0);
  const completedTotal = Object.entries(checkState).reduce(
    (s, [, arr]) => s + arr.filter(Boolean).length,
    0
  );

  const toggleCheck = (idx: number) => {
    setCheckState((prev) => {
      const arr = [...(prev[lesson.id] ?? [])];
      arr[idx] = !arr[idx];
      return { ...prev, [lesson.id]: arr };
    });
  };

  const progressPct = Math.round((completedTotal / totalChecks) * 100);

  return { lesson, currentIdx, setCurrentIdx, checks, completedCount, progressPct, toggleCheck };
}

/* ── Page ────────────────────────────────────────────────────── */
export default function CoachPage() {
  const { lesson, currentIdx, setCurrentIdx, checks, completedCount, progressPct, toggleCheck } =
    useCoachState();

  return (
    <DashboardShell>
      <DashboardHeader
        title="AGENT COACH"
        subtitle="Operator curriculum — follow the factory protocol"
        icon={<span className="text-base">◈</span>}
      />

      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 112px)', minHeight: 0 }}>
        {/* ── Left rail: lesson list ─────────────────────────── */}
        <aside className="w-[260px] shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden hidden md:flex">
          <div className="px-4 py-3 text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 border-b border-zinc-800">
            Curriculum
          </div>

          <ul className="flex-1 overflow-y-auto">
            {LESSONS.map((l, i) => {
              const isDone = i < currentIdx;
              const isCur = i === currentIdx;
              return (
                <li
                  key={l.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`grid cursor-pointer border-l-2 transition-colors ${
                    isCur
                      ? 'border-l-[oklch(0.82_0.13_195)] bg-zinc-900'
                      : isDone
                        ? 'border-l-green-500/40 hover:bg-zinc-900/50'
                        : 'border-l-transparent hover:bg-zinc-900/30'
                  }`}
                  style={{
                    gridTemplateColumns: '32px 1fr auto',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '9px 16px',
                  }}
                >
                  <span
                    className={`text-[10.5px] font-mono tracking-[0.06em] ${
                      isCur
                        ? 'text-[oklch(0.82_0.13_195)]'
                        : isDone
                          ? 'text-green-500'
                          : 'text-zinc-500'
                    }`}
                  >
                    {isDone ? '✓' : l.num}
                  </span>
                  <span
                    className={`text-[12px] font-mono truncate ${
                      isCur ? 'text-zinc-100' : isDone ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    {l.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {l.estimatedMin}m
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Progress footer */}
          <div className="px-4 py-4 border-t border-zinc-900 flex flex-col gap-2">
            <div className="h-1 bg-zinc-800 w-full overflow-hidden">
              <div
                className="h-full bg-[oklch(0.82_0.13_195)] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500">
              {progressPct}% complete · {currentIdx + 1}/{LESSONS.length} lessons
            </div>
          </div>
        </aside>

        {/* ── Center stage ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Stage head */}
          <div className="flex items-start justify-between px-7 py-5 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
            <div>
              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                {lesson.num} of {LESSONS.length.toString().padStart(2, '0')} · LESSON
              </div>
              <h1 className="mt-1.5 text-[22px] font-mono font-medium tracking-[-0.01em] text-zinc-100">
                {lesson.title}
              </h1>
            </div>
            <div className="flex gap-2 mt-1 shrink-0">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-3 py-1.5 border border-zinc-700 text-[9.5px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← PREV
              </button>
              <button
                onClick={() => setCurrentIdx((i) => Math.min(LESSONS.length - 1, i + 1))}
                disabled={currentIdx === LESSONS.length - 1}
                className="px-3 py-1.5 border border-zinc-700 bg-zinc-900 text-[9.5px] uppercase tracking-widest text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                NEXT →
              </button>
            </div>
          </div>

          {/* Stage body */}
          <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">
            {/* Concept card */}
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 mb-3">
                {lesson.concept.heading}
              </div>
              <p
                className="text-[12.5px] leading-[1.65] text-zinc-300 max-w-[72ch]"
                dangerouslySetInnerHTML={{
                  __html: lesson.concept.body
                    .replace(/<b>/g, '<span class="text-zinc-100 font-medium">')
                    .replace(/<\/b>/g, '</span>'),
                }}
              />
            </div>

            {/* Terminal card */}
            <div className="border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 pt-3 pb-2 text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 border-b border-zinc-800">
                Terminal
              </div>
              <div className="px-4 py-3 font-mono text-[11.5px]">
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: 'oklch(0.82 0.13 195)' }}>▸</span>
                  <span className="text-zinc-100">{lesson.terminal.cmd}</span>
                  <span
                    className="text-zinc-100"
                    style={{ animation: 'coachBlink 1s step-end infinite' }}
                  >
                    ▌
                  </span>
                </div>
                {lesson.terminal.output.map((line, i) => (
                  <div key={i} className="text-zinc-500 leading-[1.6]">
                    {line.startsWith('✓') ? (
                      <span style={{ color: 'oklch(0.72 0.18 145)' }}>{line}</span>
                    ) : line.includes('warn') ? (
                      <span style={{ color: 'oklch(0.85 0.18 75)' }}>{line}</span>
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hint card */}
            <div
              className="border p-4"
              style={{
                borderColor: 'color-mix(in oklab, oklch(0.82 0.13 195) 25%, oklch(0.18 0 0))',
                background: 'color-mix(in oklab, oklch(0.82 0.13 195) 4%, oklch(0.06 0 0))',
              }}
            >
              <div
                className="text-[9.5px] tracking-[0.18em] uppercase mb-2"
                style={{ color: 'oklch(0.82 0.13 195)' }}
              >
                Operator hint
              </div>
              <p className="text-[12px] text-zinc-400 leading-[1.6] max-w-[70ch]">{lesson.hint}</p>
            </div>

            {/* Checklist */}
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 mb-4">
                Completion checklist · {completedCount}/{lesson.checks.length}
              </div>
              <ul className="flex flex-col gap-2.5">
                {lesson.checks.map((item, idx) => {
                  const done = checks[idx] ?? false;
                  const isCur = !done && idx === checks.indexOf(false);
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <span
                        className="shrink-0 w-3 h-3 border transition-all"
                        style={{
                          borderColor: done
                            ? 'oklch(0.72 0.18 145)'
                            : isCur
                              ? 'oklch(0.82 0.13 195)'
                              : 'oklch(0.4 0 0)',
                          background: done
                            ? 'oklch(0.72 0.18 145)'
                            : isCur
                              ? 'oklch(0.82 0.13 195 / 0.15)'
                              : 'transparent',
                        }}
                      />
                      <span
                        className={`text-[12px] font-mono transition-colors ${
                          done
                            ? 'text-zinc-500 line-through'
                            : isCur
                              ? 'text-zinc-100'
                              : 'text-zinc-500 group-hover:text-zinc-400'
                        }`}
                      >
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {completedCount === lesson.checks.length && (
                <div
                  className="mt-4 px-3 py-2 text-[10px] tracking-[0.18em] uppercase font-mono"
                  style={{
                    color: 'oklch(0.72 0.18 145)',
                    background: 'oklch(0.72 0.18 145 / 0.08)',
                    border: '1px solid oklch(0.72 0.18 145 / 0.3)',
                  }}
                >
                  ✓ Lesson complete — advance to next module
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right practice rail ─────────────────────────────── */}
        <aside className="w-[260px] shrink-0 border-l border-zinc-800 bg-zinc-950 overflow-y-auto hidden lg:block">
          <div className="px-4 py-3 text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 border-b border-zinc-800">
            Live agent
          </div>

          {/* Agent card */}
          <div className="mx-3.5 mt-3.5 mb-2 border border-zinc-800 bg-zinc-900 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-mono font-medium text-zinc-100">
                {lesson.practiceNode.name}
              </span>
              <span className="text-[9px] tracking-[0.16em] border border-zinc-700 px-1.5 py-0.5 text-zinc-500">
                {lesson.practiceNode.tag}
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500 truncate">
              {lesson.practiceNode.did}
            </div>
            <div
              className="grid text-[11px] gap-x-3 gap-y-1"
              style={{ gridTemplateColumns: '1fr 1fr' }}
            >
              <span className="text-zinc-500">region</span>
              <span className="text-zinc-300 font-mono">{lesson.practiceNode.region}</span>
              <span className="text-zinc-500">cpu</span>
              <span className="text-zinc-300 font-mono">{lesson.practiceNode.cpu}%</span>
              <span className="text-zinc-500">p50</span>
              <span className="text-zinc-300 font-mono">{lesson.practiceNode.p50}ms</span>
            </div>
            <div className="h-0.5 bg-zinc-800 w-full overflow-hidden">
              <div
                className="h-full bg-[oklch(0.82_0.13_195)] transition-all"
                style={{ width: `${lesson.practiceNode.fitness}%` }}
              />
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500">
              fitness {lesson.practiceNode.fitness}%
            </div>
          </div>

          {/* Score breakdown */}
          <div className="px-4 py-2 text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 border-t border-zinc-900 mt-2">
            Score
          </div>
          <div className="px-4 flex flex-col gap-0">
            {lesson.practiceNode.score.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-dashed border-zinc-800/60 text-[11.5px] font-mono"
              >
                <span className="text-zinc-500">{s.label}</span>
                <span
                  style={{
                    color: s.accent ? 'oklch(0.82 0.13 195)' : undefined,
                  }}
                  className={s.accent ? '' : 'text-zinc-400'}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Next up */}
          <div className="px-4 py-3 text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 border-t border-zinc-900 mt-3">
            Next up
          </div>
          <div className="px-4 flex flex-col gap-0">
            {lesson.practiceNode.nextUp.map((n, i) => (
              <div
                key={i}
                className={`py-1.5 text-[11.5px] font-mono border-b border-dashed border-zinc-800/60 ${
                  i === 0 ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {n}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes coachBlink { 50% { opacity: 0; } }
      `}</style>
    </DashboardShell>
  );
}
