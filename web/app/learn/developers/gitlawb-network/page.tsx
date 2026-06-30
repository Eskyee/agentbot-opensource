import Link from 'next/link';

const AGENTBOT_GITLAWB_DID = 'did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY';
const AGENTBOT_GITLAWB_REPO = 'agentbot-opensource';
const AGENTBOT_GITLAWB_WEB_URL = `https://gitlawb.com/${AGENTBOT_GITLAWB_DID.replace(
  'did:key:',
  ''
)}/${AGENTBOT_GITLAWB_REPO}`;
const AGENTBOT_GITLAWB_CLONE = `git clone gitlawb://${AGENTBOT_GITLAWB_DID}/${AGENTBOT_GITLAWB_REPO}`;
const AGENTBOT_GITLAWB_REPO_CARD_URL =
  'https://gitlawb.com/node/repos/z6MkpUq1/agentbot-opensource';

const steps = [
  {
    title: 'Watch the network',
    body: 'Use the Gitlawb Network dashboard to inspect node health, ref events, peer connectivity, and the current network snapshot from inside Agentbot.',
  },
  {
    title: 'Browse repos',
    body: 'Open the public Gitlawb repo browser to inspect mirrored repos, peer identities, and the event stream around those repos.',
  },
  {
    title: 'Clone the Agentbot mirror',
    body: 'Use the Gitlawb clone URL to pull the decentralized mirror of the Agentbot open-source repo through DID identity instead of a centralized forge URL.',
  },
  {
    title: 'Push your own agent code later',
    body: 'Treat Gitlawb as the network layer for agent-owned repos and refs. Agentbot can use that as an operator surface today while deeper network automation grows over time.',
  },
];

export default function GitlawbNetworkGuidePage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/learn/developers"
          className="text-zinc-400 hover:text-white mb-8 inline-block text-xs uppercase tracking-widest"
        >
          ← Back to Developers
        </Link>

        <div className="border border-zinc-800 bg-zinc-950 p-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">
            Gitlawb Network
          </p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
            Use Gitlawb From Agentbot
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Agentbot already exposes a Gitlawb Network operator surface and links into the live
            network. This page explains the practical path: inspect the network, browse repos, and
            use the decentralized Agentbot mirror as your starting point.
          </p>
        </div>

        <div className="grid gap-px bg-zinc-900 mt-8 md:grid-cols-2">
          <div className="bg-black p-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
              Agentbot Mirror
            </div>
            <p className="text-xs text-zinc-500 mb-2">DID</p>
            <code className="block text-xs text-zinc-300 break-all">{AGENTBOT_GITLAWB_DID}</code>
            <p className="text-xs text-zinc-500 mt-4 mb-2">Web</p>
            <a
              href={AGENTBOT_GITLAWB_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-500 hover:text-white break-all"
            >
              {AGENTBOT_GITLAWB_WEB_URL}
            </a>
          </div>
          <div className="bg-black p-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Clone</div>
            <code className="block text-xs text-green-400 break-all whitespace-pre-wrap">
              {AGENTBOT_GITLAWB_CLONE}
            </code>
            <p className="mt-4 text-xs text-zinc-500">
              Use this when you want the decentralized Gitlawb path rather than GitHub.
            </p>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-6 mt-8">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Repo Card</div>
          <div className="text-sm text-zinc-400 mb-4">
            The Gitlawb repo card is the cleanest direct public link for Agentbot&apos;s mirrored
            open-source repository on the network.
          </div>
          <a
            href={AGENTBOT_GITLAWB_REPO_CARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 hover:text-white break-all"
          >
            {AGENTBOT_GITLAWB_REPO_CARD_URL}
          </a>
        </div>

        <section className="border border-zinc-800 mt-8">
          <div className="border-b border-zinc-800 p-4">
            <h2 className="text-lg font-bold uppercase tracking-tight">How To Use It</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {steps.map((step, index) => (
              <div key={step.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 mt-8">
          <Link
            href="/dashboard/gitlawb-network"
            className="border border-zinc-800 p-5 hover:border-zinc-600 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
              Inside Agentbot
            </div>
            <div className="text-sm font-bold text-white">Open Network Dashboard</div>
            <p className="mt-2 text-xs text-zinc-500">
              Operator surface, node registry, ref events, and external network links.
            </p>
          </Link>
          <a
            href="https://gitlawb.com/node/repos"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-800 p-5 hover:border-zinc-600 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
              On Network
            </div>
            <div className="text-sm font-bold text-white">Browse Repos</div>
            <p className="mt-2 text-xs text-zinc-500">
              Inspect mirrored repos, refs, and repo-level network activity.
            </p>
          </a>
          <a
            href="https://gitlawb.com/node/events"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-800 p-5 hover:border-zinc-600 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
              Live Feed
            </div>
            <div className="text-sm font-bold text-white">Open Ref Events</div>
            <p className="mt-2 text-xs text-zinc-500">
              Watch ref propagation and node activity directly from the network surface.
            </p>
          </a>
        </section>

        <div className="border border-zinc-800 bg-zinc-950 p-6 mt-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Current State</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Agentbot is already linked to the Gitlawb world through the mirrored open-source repo
            and the in-app network operator screen. The next step is deeper live integration, but
            the teaching path and the mirror path are already here.
          </p>
        </div>
      </div>
    </main>
  );
}
