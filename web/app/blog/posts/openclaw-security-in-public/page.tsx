import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How OpenClaw Got Safer in Public — Agentbot Blog',
  description:
    'Open source is supposed to be the unsafe option. OpenClaw started on a Mac in Vienna as an experiment — now companies run it in production and help secure it.',
};

export default function Page() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      <Link
        href="/blog"
        className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white mb-8 inline-block"
      >
        ← Back to Blog
      </Link>

      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-widest text-orange-400 border border-orange-500/30 px-2 py-0.5">
            Field Notes
          </span>
          <span className="text-[10px] text-zinc-500">30 Apr 2026</span>
          <span className="text-[10px] text-zinc-600">· 6 min read</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          How OpenClaw Got Safer in Public
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
            PS
          </div>
          <div>
            <p className="text-sm text-white">Peter Steinberger</p>
            <p className="text-[10px] text-zinc-500">@steipete</p>
          </div>
        </div>
      </header>

      <div className="prose prose-invert prose-zinc max-w-none">
        <p className="text-zinc-300 leading-relaxed text-sm">
          OpenClaw started on my Mac in Vienna as an experiment. A lot of people screamed it was so
          insecure.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Open source is supposed to be the unsafe option because everyone can see the code. Sure.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          People used it anyway, loved it, and now companies run it in production. Those same
          companies are the ones now helping us secure it. Nothing that can run tools, hold
          credentials and install plugins is safe by default. But being open is why we got safer
          quickly, in public.
        </p>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">Why So Many Reports?</h2>

        <p className="text-zinc-300 leading-relaxed text-sm">
          OpenClaw launched into a weird moment for open source security. In January, curl killed
          its bug bounty program after drowning in reports that sounded technical, referenced real
          functions and contained nothing exploitable. Daniel Stenberg called it &ldquo;death by a
          thousand slops.&rdquo;
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Plus, we are the most-watched AI agent project in the world. Every CVE against OpenClaw is
          a career trophy, so of course people look.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          As of April 30, GitHub shows 1,309 security advisories since January 10. 535 were
          published. 746 were closed as invalid. The number coming in has dropped significantly over
          the last few months as we hardened the whole system.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          The closer a report sits to &ldquo;critical&rdquo;, the more likely it is to be nonsense.
          GitHub currently shows 109 critical reports: 14 published, 95 closed as invalid. That is
          87%.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          The false positives are often wonderfully dumb: &ldquo;the agent runs commands, therefore
          RCE&rdquo;, &ldquo;plugins execute code&rdquo;, &ldquo;this dangerous opt-in mode is
          dangerous&rdquo;, &ldquo;if I already have the token I can do bad things.&rdquo;
        </p>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">What Actually Changed</h2>

        <p className="text-zinc-300 leading-relaxed text-sm">
          At first I was just annoyed at how the game worked. A security advisory used to be an
          event: stop everything, reproduce, inspect, patch, disclose, ship. Five times a year was
          annoying; fifteen times a day breaks the process.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          What we needed was a triage tool, not a magical sandbox: a way to decide whether a report
          describes a real boundary violation or OpenClaw doing expected OpenClaw things.{' '}
          <a
            href="https://github.com/openclaw/openclaw/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-white underline"
          >
            SECURITY.md
          </a>{' '}
          defines the trust model, documents expected behavior, and gives maintainers something
          concrete to point at when closing bad reports.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Real bugs remain. OpenClaw moves fast and does weird stuff. We fixed authentication bugs,
          privilege confusion, reconnect scope widening, sandbox bypasses, unsafe env handling and
          approval path mistakes.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Some of this cost regular users features. We tightened allowlists, accepted regressions
          where the single-machine setup (the Mac Mini on your desk, your laptop) was fine, and
          shipped fast even when fast hurt. Most of the hardening targets multi-user threats most
          users never hit. We did it anyway, because the people who do hit them are now running this
          in production.
        </p>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">Built for Production</h2>

        <p className="text-zinc-300 leading-relaxed text-sm">
          We shrank the core. Over the last few months we pushed more functionality out to{' '}
          <a
            href="https://docs.openclaw.ai/plugins/sdk-overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-white underline"
          >
            plugins
          </a>
          , which means a smaller attack surface, a shorter dependency tree and a clearer trust
          boundary. A poisoned upstream package has fewer paths to actually reach a user.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Releases used to be just me. Now it&rsquo;s me plus another{' '}
          <a
            href="https://www.openclaw.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-white underline"
          >
            OpenClaw Foundation
          </a>{' '}
          employee, with each one scripted, gated and signed off. End-to-end testing in CI got
          leveled up so agent flows run on every PR instead of waiting for someone&rsquo;s laptop.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          We added{' '}
          <a
            href="https://docs.openclaw.ai/gateway/opentelemetry"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-white underline"
          >
            observability
          </a>
          : OpenTelemetry, Prometheus metrics, higher-throughput logging and better signals. Secrets
          moved away from &ldquo;please be careful&rdquo; toward references, so credentials do not
          end up sitting in prompts, logs, transcripts or agent state.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Plugins can act as harnesses now. Wire OpenAI Codex in as{' '}
          <a
            href="https://docs.openclaw.ai/plugins/codex-harness"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-white underline"
          >
            the harness
          </a>{' '}
          for GPT models and you inherit its controls, including Guardian for per-action gating,
          instead of running the agent in accept-each-request or YOLO mode.
        </p>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">The Team Behind It</h2>

        <p className="text-zinc-300 leading-relaxed text-sm">
          OpenClaw is not just me anymore. It&rsquo;s me plus an army of maintainers who triage
          reports, review patches, ship releases and take calls at stupid hours when something real
          lands. Most have day jobs. They still show up.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          They have help. CodeQL, Semgrep, Codex Security and maintainer-owned checks catch weak
          commits before they merge. ClawSweeper handles issue and PR triage so the team can keep up
          with the firehose.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          NVIDIA showed up early with engineering time, security thinking and work on NemoClaw and
          OpenShell.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Microsoft and GitHub helped at the platform level through the GitHub Secure Open Source
          Fund. Atlassian and other enterprise partners pushed on deployment, auditability, identity
          boundaries and secret handling. Blacksmith gives us the runner capacity to test agent
          paths at the rate we ship.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Tencent added full-time maintainers on security, stability and ClawHub, plus a direct
          vulnerability-sync line with their internal security team.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          OpenAI continues to support the project with inference, gave us Codex Security to
          proactively find and fix security issues, and has made commitments that help keep OpenClaw
          open and independent as the Foundation comes together. Inside OpenAI, I run a team called
          Claw Labs that works on shared product improvements.
        </p>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">ClawHub</h2>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Convex helped maintain ClawHub while we rebuilt the security posture around it. You do not
          secure marketplaces once. You keep watching, pruning and making the weird stuff easier to
          spot.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          In the last month alone the team closed more than 700 ClawHub moderation issues, around
          460 of them rescan appeals from skill authors whose work the automated suspicious flag had
          misfired on. We will publish more of the ClawHub security findings soon.
        </p>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">Agents of Chaos</h2>

        <p className="text-zinc-300 leading-relaxed text-sm">
          The Agents of Chaos paper that made the rounds in February is the loudest example of the
          incentive problem. Twenty researchers attacked six OpenClaw agents for two weeks and found
          ugly failures.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          The annoying part is the framing. They ran OpenClaw in sudo mode with disabled guardrails,
          broad shell access and no sandboxing, then wrote up the results as if this is what users
          get out of the box. The paper has since added a short acknowledgment that guardrails were
          disabled; the headlines did not.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          The lesson is simpler. OpenClaw is built for one trusted person per agent. Share that
          agent with people you don&rsquo;t trust, and they share its tool access. That is the
          design, not a hidden auth bug. For groups or companies, split agents and credentials per
          trust boundary, and turn on sandboxing.
        </p>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">Fixes Count</h2>

        <p className="text-zinc-300 leading-relaxed text-sm">
          The security industry rewards disclosure, not repair. To researchers: I would much rather
          read your slightly broken report with a real reproduction than your perfectly formatted
          slop. &ldquo;I found and fixed a vulnerability in OpenClaw&rdquo; should carry more credit
          than &ldquo;I filed the scariest GHSA title.&rdquo;
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm">
          Open and safe are not opposites. Open is how we get to safe at all.
        </p>

        <p className="text-zinc-300 leading-relaxed text-sm font-bold text-orange-400 mt-8">
          The claw is the law. 🦞
        </p>
      </div>

      <footer className="mt-16 pt-8 border-t border-zinc-900">
        <div className="flex items-center gap-4">
          <a
            href="https://openclaw.ai/blog/openclaw-security-in-public/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white"
          >
            Original on openclaw.ai →
          </a>
        </div>
      </footer>
    </article>
  );
}
