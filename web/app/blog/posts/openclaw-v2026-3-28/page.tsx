import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenClaw v2026.3.28 — Tool Approval Gates, xAI Search, MiniMax Image Gen',
  description: 'The biggest OpenClaw release since 3.24. Tool approval gates, Grok x_search, MiniMax image-01, ACP channel binds, and 80+ fixes. Live on Agentbot now.',
  keywords: ['OpenClaw', 'v2026.3.28', 'update', 'release', 'agent', 'xAI', 'Grok', 'MiniMax', 'image generation'],
  openGraph: {
    title: 'OpenClaw v2026.3.28 — Tool Approval Gates, xAI Search, MiniMax Image Gen',
    description: 'The biggest OpenClaw release since 3.24. Live on Agentbot now.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/openclaw-v2026-3-28',
  },
}

export default function OpenClawV2026328Post() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">29 March 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">OpenClaw v2026.3.28</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Release</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Tools</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">xAI</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Image Gen</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-6">
            OpenClaw v2026.3.28 dropped overnight — the biggest release since 3.24. Agentbot is already running it.
            This one adds genuine user-control features: agents can now pause and ask before executing tools,
            Grok gets native web search, and MiniMax agents can generate images. Plus 80+ bug fixes across
            every major platform integration. Here&apos;s what changed.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Highlights</h2>

          <div className="grid gap-4 mb-8">
            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">Tool Approval Gates</h3>
              <p className="text-zinc-300 text-sm">
                Plugins can now attach <code>requireApproval</code> to <code>before_tool_call</code> hooks.
                When triggered, the agent pauses and surfaces an approval prompt — via the exec overlay,
                Telegram inline buttons, Discord interactions, or <code>/approve</code> on any channel.
                The <code>/approve</code> command now handles both exec and plugin approvals with automatic
                fallback. Agents ask before they act.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">Grok Gets Native Web Search</h3>
              <p className="text-zinc-300 text-sm">
                The bundled xAI provider moves to the Responses API and gains first-class <code>x_search</code> —
                Grok&apos;s own web search tool. The xAI plugin auto-enables from existing web-search and tool
                config, so there&apos;s no manual toggle. <code>x_search</code> setup is also offered during
                <code> openclaw onboard</code> and <code>openclaw configure --section web</code>, with a
                model picker tied to the shared xAI key.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">MiniMax Image Generation</h3>
              <p className="text-zinc-300 text-sm">
                <code>image-01</code> lands as a MiniMax image generation provider — text-to-image and
                image-to-image editing with aspect ratio control. The legacy MiniMax model catalog is trimmed
                to M2.7 only; M2, M2.1, M2.5, and VL-01 are removed.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">ACP Channel Binds</h3>
              <p className="text-zinc-300 text-sm">
                Discord, BlueBubbles, and iMessage now support current-conversation ACP binds.
                <code> /acp spawn codex --bind here</code> turns the active chat into a Codex-backed
                workspace without creating a child thread. The release also documents the distinction
                between chat surface, ACP session, and runtime workspace — useful if you&apos;ve been confused
                about where context lives.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">CLI Backends on the Plugin Surface</h3>
              <p className="text-zinc-300 text-sm">
                Claude CLI, Codex CLI, and Gemini CLI inference defaults move onto the plugin surface.
                Gemini CLI gets bundled backend support. The <code>--claude-cli-logs</code> flag is replaced
                by <code>--cli-backend-logs</code> (old flag kept as an alias). Bundled plugin configs
                auto-load — no more manual <code>plugins.allow</code> entries for built-in CLI backends.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Full Changelog</h2>

          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-3 text-zinc-400">Platform</h3>
              <ul className="list-disc list-inside text-zinc-300 space-y-1.5 text-sm">
                <li>Podman: simplified rootless container setup, launch helper installs to <code>~/.local/bin</code></li>
                <li>Slack: explicit <code>upload-file</code> action with filename/title/comment overrides for channels and DMs</li>
                <li>Teams + Google Chat: unified <code>upload-file</code> action; BlueBubbles <code>sendAttachment</code> aliased through it</li>
                <li>OpenAI + Codex: <code>apply_patch</code> enabled by default, sandbox policy aligned to <code>write</code></li>
                <li>Matrix TTS: auto-TTS replies sent as native Matrix voice bubbles, not generic audio attachments</li>
                <li>Memory/plugins: pre-compaction flush plan moved behind the <code>memory-core</code> plugin contract</li>
                <li>CLI: <code>openclaw config schema</code> added to print the generated JSON schema for <code>openclaw.json</code></li>
                <li>Config/TTS: legacy speech config auto-migrated on normal reads; old bundled <code>tts.&lt;provider&gt;</code> shapes removed from runtime</li>
                <li>Tavily: outbound requests marked with <code>X-Client-Source: openclaw</code></li>
                <li>Agents/compaction: post-compaction AGENTS refresh preserved on stale-usage preflight; cancel reasons surfaced; benign <code>/compact</code> no-ops labelled as skipped</li>
                <li>Plugins/runtime: <code>runHeartbeatOnce</code> exposed in plugin <code>system</code> namespace with delivery target override</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-3 text-zinc-400">Fixes — Agents & Models</h3>
              <ul className="list-disc list-inside text-zinc-300 space-y-1.5 text-sm">
                <li>Anthropic stop reasons like <code>sensitive</code> recovered as structured errors instead of crashing the run</li>
                <li>Gemini 3.1 pro, flash, and flash-lite resolved across all Google provider aliases; flash-lite prefix ordering fixed</li>
                <li>Rate-limit cooldowns scoped per model — one 429 no longer blocks every model on the same auth profile; stepped 30s/1m/5m ladder replaces exponential escalation</li>
                <li>Codex image tools: media understanding registered, image prompts routed through Codex instructions</li>
                <li>Generic image-runtime fallback restored for providers like <code>openrouter</code> and <code>minimax-portal</code></li>
                <li>OpenAI/WS: reasoning replay metadata and tool-call item ids preserved across WebSocket tool turns</li>
                <li>Agents/model switching: <code>/model</code> changes applied at next safe retry boundary on active embedded runs</li>
                <li>Agents/sandbox: <code>tools.sandbox.tools.alsoAllow</code> honoured; glob-aware blocked-tool guidance; session keys redacted from explain hints</li>
                <li>Agents/failover: Codex <code>server_error</code> and HTTP 410 classified as failoverable; HTTP 400 deduplication for OpenAI-compatible tool calls</li>
                <li>Agents/compaction: timeout recovery triggered before retrying high-context LLM timeouts; <code>compactionCount</code> reconciled after late auto-compaction</li>
                <li>Anthropic 4.6: correct 1.0m context window shown in <code>/status</code></li>
                <li>Ollama: <code>thinkingLevel=off</code> routed through live extension path; non-2xx errors surface with status code for fallback</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-3 text-zinc-400">Fixes — Channels</h3>
              <ul className="list-disc list-inside text-zinc-300 space-y-1.5 text-sm">
                <li>WhatsApp: infinite echo loop in self-chat DM mode fixed; allowFrom policy error message clarified; quoted-message @mentions no longer trigger mention gating</li>
                <li>Telegram: long messages split at verified word boundaries; whitespace-only replies skipped to prevent GrammyError 400; <code>replyToMessageId</code> normalised; forum topic <code>/new</code> and <code>/reset</code> stay in active topic; bot-pinned status cards no longer trigger bogus pairing requests; verbose tool summaries restored in forum sessions</li>
                <li>Discord: stale gateway sockets drained on forced reconnects; reconnect-exhausted events suppressed during intentional shutdown; <code>@buape/carbon</code> updated for <code>RateLimitError</code> constructor change; leading indentation preserved when stripping inline reply tags</li>
                <li>iMessage: <code>[[reply_to:...]]</code> tags stripped from delivered text, sent as RPC metadata instead</li>
                <li>Feishu: WebSocket ghost connections closed on monitor stop; original <code>create_time</code> used for inbound timestamps; synthetic agent ids ignored during tool execution</li>
                <li>Mattermost: pairing and slash-command replies stay on resolved config path for <code>exec:</code> SecretRef bot tokens</li>
                <li>Teams: <code>welcomeCard</code>, <code>groupWelcomeCard</code>, <code>promptStarters</code>, and feedback keys accepted in strict config validation; freshest personal conversation reference preferred for proactive DMs</li>
                <li>BlueBubbles: null message text guarded at debounce enqueue; CLI agent inbound image refs restored; macOS Contacts names optionally enriched in group participant lists</li>
                <li>Matrix: E2EE image thumbnails encrypted with <code>thumbnail_file</code>; <code>matrix.to</code> display-name mentions recognised; DM routing kept out of 2-person rooms after <code>m.direct</code> seeds; poll question/options included in reply context; plugin bootstrap crash on mixed SDK entrypoints fixed; SecretRef <code>accessToken</code> resolved on startup</li>
                <li>Mistral: OpenAI-compatible request flags normalised, 422 errors resolved</li>
                <li>GitHub Copilot: large <code>expires_at</code> values clamped to prevent <code>setTimeout</code> overflow hot loop</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-3 text-zinc-400">Fixes — Plugins & CLI</h3>
              <ul className="list-disc list-inside text-zinc-300 space-y-1.5 text-sm">
                <li>MCP/channels: Gateway-backed channel MCP bridge added with Codex/Claude conversation tools</li>
                <li>ACP/ACPX: built-in agent mirror aligned with latest <code>openclaw/acpx</code> defaults; unknown agent ids no longer fall through to raw <code>--agent</code> exec on MCP-proxy path</li>
                <li>Security/audit: web search key audit extended to Gemini, Grok/xAI, Kimi, Moonshot, OpenRouter</li>
                <li>Plugins/runtime: compatible plugin registries reused across tools, providers, web search, and channel bootstrap; outbound channel recovery retried on pinned surface changes</li>
                <li>Plugin SDK: <code>moduleUrl</code> threaded through alias resolution for user-installed plugins in <code>~/.openclaw/extensions/</code></li>
                <li>Plugins/diffs: bundled <code>@pierre/diffs</code> runtime deps staged during packaged updates; Pierre themes loaded without JSON module imports</li>
                <li>Plugins/uninstall: owned <code>channels.&lt;id&gt;</code> config removed on channel plugin uninstall</li>
                <li>Claude CLI: switched to <code>stream-json</code> output; strict <code>--mcp-config</code> overlay always passed for background runs</li>
                <li>CLI/zsh: <code>compdef</code> deferred until <code>compinit</code> available</li>
                <li>CLI/plugins: routed commands use auto-enabled bundled-channel snapshot matching gateway startup</li>
                <li>CLI/message send: <code>openclaw message send</code> deliveries written into resolved agent session transcript</li>
                <li>Config/Doctor: stale bundled plugin load paths rewritten from legacy <code>extensions/*</code></li>
                <li>Config/web fetch: <code>tools.web.fetch.maxResponseBytes</code> accepted in runtime schema</li>
                <li>Control UI/config: sensitive raw config hidden by default; reveal-to-edit state replaces blank blocked editor</li>
                <li>Control UI/Skills: skill detail dialogs opened with browser modal lifecycle, panel stays centred</li>
                <li>Heartbeat/runner: interval timer guaranteed to re-arm after errors</li>
                <li>Daemon/Linux: non-gateway systemd services no longer flagged as duplicate gateways</li>
                <li>Talk/macOS: system-voice failures stop replaying system speech; app-locale fallback used for watchdog timing</li>
              </ul>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Breaking Changes</h2>
          <div className="space-y-px bg-zinc-800 mb-8">
            <div className="bg-zinc-950 p-4 flex items-start gap-3">
              <div className="w-1 h-1 bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="text-sm text-zinc-300">
                <strong className="text-white">Qwen portal auth removed.</strong>{' '}
                The deprecated <code>qwen-portal-auth</code> OAuth integration for <code>portal.qwen.ai</code> is gone.
                Migrate with: <code>openclaw onboard --auth-choice modelstudio-api-key</code>
              </div>
            </div>
            <div className="bg-zinc-950 p-4 flex items-start gap-3">
              <div className="w-1 h-1 bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="text-sm text-zinc-300">
                <strong className="text-white">Old config migrations dropped.</strong>{' '}
                Automatic migrations older than two months are removed. Very old legacy keys now fail validation
                instead of being rewritten on load or by <code>openclaw doctor</code>.
                Run <code>openclaw doctor</code> to fix any stale config before upgrading.
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
            <p className="text-zinc-300 mb-1">Agentbot is already running v2026.3.28.</p>
            <p className="text-zinc-500 text-sm mb-4">Every OpenClaw improvement ships automatically to all agents — no action needed.</p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/dashboard"
                className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
              >
                Open Dashboard
              </Link>
              <Link
                href="https://github.com/openclaw/openclaw/releases/tag/v2026.3.28"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-zinc-800 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
              >
                Full Release Notes
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
