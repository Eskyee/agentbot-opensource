/**
 * Design System Showcase — every primitive in the Agentbot ui kit, live.
 * Brand rules per app/design-system.css: black bg, zinc borders, mono type,
 * orange accent, uppercase tracking-widest labels.
 */
'use client'

import { useState } from 'react'
import {
  Button,
  Badge,
  Input,
  Switch,
  Skeleton,
  Progress,
  Separator,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  StatusDot,
  Kbd,
  Snippet,
  Gauge,
  Note,
  Spinner,
  LoadingDots,
  ShowMore,
} from '@/app/components/ui'

function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-zinc-900 py-12 sm:py-16">
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
        {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-800 bg-black p-5">
      <div className="mb-4 text-[10px] uppercase tracking-widest text-zinc-600">{label}</div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const COLORS = [
  { name: 'Background', cls: 'bg-black border border-zinc-800', hex: '#000000' },
  { name: 'Surface', cls: 'bg-zinc-950 border border-zinc-800', hex: '#0a0a0a' },
  { name: 'Border', cls: 'bg-zinc-800', hex: 'zinc-800' },
  { name: 'Text / Primary', cls: 'bg-white', hex: '#ffffff' },
  { name: 'Text / Secondary', cls: 'bg-zinc-400', hex: 'zinc-400' },
  { name: 'Text / Muted', cls: 'bg-zinc-500', hex: 'zinc-500' },
  { name: 'Accent', cls: 'bg-orange-500', hex: '#EF6F2E' },
  { name: 'Online', cls: 'bg-emerald-500', hex: 'emerald-500' },
  { name: 'Warning', cls: 'bg-yellow-500', hex: 'yellow-500' },
  { name: 'Error', cls: 'bg-red-500', hex: 'red-500' },
]

export function Showcase() {
  const [expanded, setExpanded] = useState(false)
  const [gauge, setGauge] = useState(72)

  return (
    <main className="min-h-screen bg-black pt-14 font-mono text-white">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-24">
        {/* Hero */}
        <div className="mb-12">
          <div className="mb-4 inline-block border border-orange-500/30 px-3 py-1 text-[10px] uppercase tracking-widest text-orange-500">
            One source of truth
          </div>
          <h1 className="text-4xl font-bold uppercase leading-[0.9] tracking-tighter sm:text-5xl">
            Design <span className="text-orange-500">System</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
            Every primitive in the Agentbot ui kit, live. Geist-inspired components from{' '}
            <a
              href="https://github.com/immatheus/vercel-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              vercel/ui
            </a>{' '}
            adapted to the brand — mono type, zinc-on-black, orange accent.
          </p>
        </div>

        {/* Colors */}
        <Section title="Colors" note="Black base, zinc scale, single orange accent.">
          <div className="grid grid-cols-2 gap-px bg-zinc-900 sm:grid-cols-5">
            {COLORS.map((c) => (
              <div key={c.name} className="bg-black p-4">
                <div className={`h-10 w-full ${c.cls}`} />
                <div className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">{c.name}</div>
                <div className="text-[10px] text-zinc-700">{c.hex}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography" note="Uppercase, tight tracking on headings; widest tracking on labels.">
          <div className="space-y-5 border border-zinc-800 bg-black p-6">
            <div className="text-4xl font-bold uppercase leading-[0.9] tracking-tighter sm:text-5xl">Heading One</div>
            <div className="text-2xl font-bold uppercase tracking-tighter sm:text-3xl">Heading Two</div>
            <div className="text-sm font-bold uppercase tracking-wider">Heading Three</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Label · 10px widest</div>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400">
              Body — text-sm leading-relaxed zinc-400. The quick brown agent jumps over the lazy daemon.
            </p>
            <div className="text-xs text-zinc-500">Small — text-xs zinc-500</div>
          </div>
        </Section>

        {/* Geist additions */}
        <Section title="Status Dot" note="Flexible state names with optional live pulse — used in the dashboard sidebar.">
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <Cell label="States">
              <StatusDot state="online" label />
              <StatusDot state="building" label />
              <StatusDot state="degraded" label />
              <StatusDot state="error" label />
              <StatusDot state="queued" label />
              <StatusDot state="idle" label />
            </Cell>
            <Cell label="Pulse + custom label">
              <StatusDot state="online" pulse label="Agent paired" />
              <StatusDot state="building" pulse label="Deploying" />
            </Cell>
          </div>
        </Section>

        <Section title="Loading" note="Geist 12-blade spinner and blinking dots.">
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-3">
            <Cell label="Spinner">
              <Spinner size={16} />
              <Spinner size={24} />
              <Spinner size={32} />
            </Cell>
            <Cell label="Loading dots">
              <LoadingDots />
              <LoadingDots size={4} className="text-orange-400" />
            </Cell>
            <Cell label="With label">
              <LoadingDots size={3}>
                <span className="text-xs text-zinc-400">Provisioning container</span>
              </LoadingDots>
            </Cell>
          </div>
        </Section>

        <Section title="Gauge" note="Semantic thresholds by default — green ≥ 68, amber ≥ 34, red below.">
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <Cell label="Sizes">
              <Gauge value={gauge} size="small" />
              <Gauge value={gauge} size="medium" showValue />
              <Gauge value={gauge} size="large" showValue />
            </Cell>
            <Cell label="Thresholds + brand color">
              <Gauge value={18} size="medium" showValue />
              <Gauge value={50} size="medium" showValue />
              <Gauge value={92} size="medium" showValue />
              <Gauge value={64} size="medium" showValue color="#EF6F2E" />
              <input
                type="range"
                min={0}
                max={100}
                value={gauge}
                onChange={(e) => setGauge(Number(e.target.value))}
                className="w-full accent-orange-500"
                aria-label="Gauge value"
              />
            </Cell>
          </div>
        </Section>

        <Section title="Snippet" note="Copy-to-clipboard command blocks — used on the OpenClaw quick-start.">
          <div className="space-y-3">
            <Snippet text="npm install -g openclaw@latest" />
            <Snippet text={['openclaw onboard --install-daemon', 'openclaw dashboard']} />
            <Snippet text="agent deploy --plan label" type="brand" />
            <Snippet text="rm -rf ./caches" type="warning" prompt={false} />
          </div>
        </Section>

        <Section title="Note" note="Inline callouts.">
          <div className="space-y-3">
            <Note>Your agent restarts automatically after configuration changes.</Note>
            <Note type="success">Webhook verified — deliveries are flowing.</Note>
            <Note type="warning" action={<Button size="sm" variant="outline">Upgrade</Button>}>
              You are at 90% of your token quota.
            </Note>
            <Note type="error">Container failed health check 3 times.</Note>
            <Note type="brand">New: agent-to-agent negotiation is live.</Note>
          </div>
        </Section>

        <Section title="Keyboard" note="Kbd hints for shortcuts.">
          <Cell label="Combinations">
            <span className="text-xs text-zinc-400">
              Search <Kbd meta>K</Kbd>
            </span>
            <span className="text-xs text-zinc-400">
              Deploy <Kbd meta shift>D</Kbd>
            </span>
            <span className="text-xs text-zinc-400">
              Cancel <Kbd small>Esc</Kbd>
            </span>
          </Cell>
        </Section>

        <Section title="Show More" note="Divider with expand trigger.">
          <div className="border border-zinc-800 bg-black p-5">
            <p className="text-sm leading-relaxed text-zinc-400">
              Agents communicate over the SSRF-protected bus and settle in USDC.
            </p>
            {expanded && (
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Each agent gets its own Coinbase CDP wallet, Caddy-routed subdomain, and per-user
                token quota tracked through OpenRouter.
              </p>
            )}
            <div className="mt-4">
              <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
            </div>
          </div>
        </Section>

        {/* Core kit */}
        <Section title="Buttons" note="Core shadcn-based kit.">
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <Cell label="Variants">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </Cell>
            <Cell label="Sizes + states">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline">
                <Spinner size={14} /> Saving
              </Button>
            </Cell>
          </div>
        </Section>

        <Section title="Badges">
          <Cell label="Variants">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Cell>
        </Section>

        <Section title="Forms">
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <Cell label="Input">
              <Input placeholder="agent-name.agentbot.sh" className="max-w-xs" />
              <Input placeholder="Disabled" disabled className="max-w-xs" />
            </Cell>
            <Cell label="Switch + Progress">
              <Switch defaultChecked aria-label="Toggle feature" />
              <Switch aria-label="Toggle feature off" />
              <Progress value={66} className="w-40" />
            </Cell>
          </div>
        </Section>

        <Section title="Tabs + Card">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Agent Runtime</CardTitle>
              <CardDescription>OpenClaw container · label plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="status">
                <TabsList>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="status" className="pt-4">
                  <StatusDot state="online" pulse label="All systems go" />
                </TabsContent>
                <TabsContent value="usage" className="pt-4">
                  <div className="flex items-center gap-4">
                    <Gauge value={42} size="small" />
                    <span className="text-xs text-zinc-400">42% of monthly tokens</span>
                  </div>
                </TabsContent>
                <TabsContent value="logs" className="pt-4">
                  <Skeleton className="mb-2 h-3 w-full" />
                  <Skeleton className="mb-2 h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </Section>

        <Section title="Separator + Skeleton">
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <Cell label="Separator">
              <div className="w-full">
                <div className="text-xs text-zinc-400">Section A</div>
                <Separator className="my-3" />
                <div className="text-xs text-zinc-400">Section B</div>
              </div>
            </Cell>
            <Cell label="Skeleton">
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </Cell>
          </div>
        </Section>

        <footer className="border-t border-zinc-900 pt-8 text-[10px] uppercase tracking-widest text-zinc-700">
          Agentbot Design System · import from @/app/components/ui
        </footer>
      </div>
    </main>
  )
}
