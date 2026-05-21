'use client'

import { useState } from 'react'

const nodeIdentity = {
  status: 'online',
  network: 'alpha',
  did: 'did:key:z6Mkicjkc95VcFx38Xg2SvFV2ENsu3dLDoWborjPGVodHXoH',
  peerId: '12D3KooWJ8FTHLfbEkXprCACu7qhBazEKzr3ber4JQ3KsGHiRHAe',
  protocols: ['git-smart-http', 'mcp', 'libp2p'],
  repoUrl: 'https://gitlawb.com/node/repos/z6MkpUq1/agentbot-opensource',
  nodeUrl: 'https://gitlawb.com/node',
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function GitlawbNodeIdentityCard() {
  const [copied, setCopied] = useState<'did' | 'peer' | null>(null)

  async function handleCopy(kind: 'did' | 'peer', value: string) {
    try {
      await copyText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <section className="border-t border-zinc-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-px bg-zinc-900 lg:grid-cols-[.75fr_1.25fr]">
          <div className="bg-black p-5 sm:p-6">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-cyan-300">GitLawb Node Identity</div>
            <h2 className="text-2xl font-bold uppercase tracking-tighter text-white sm:text-3xl">
              Agentbot repo lives on GitLawb.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-500">
              Agentbot projects can publish to a decentralized GitLawb node with smart HTTP, MCP, and libp2p available
              from the same operator surface.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={nodeIdentity.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white px-5 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
              >
                Open repo
              </a>
              <a
                href={nodeIdentity.nodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-zinc-800 px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:border-cyan-400 hover:text-white"
              >
                Inspect node
              </a>
            </div>
          </div>

          <div className="bg-black p-5 sm:p-6">
            <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
              <div className="bg-zinc-950 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">Status</div>
                <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-lime-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                  {nodeIdentity.status}
                </div>
              </div>
              <div className="bg-zinc-950 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">Network</div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-200">{nodeIdentity.network}</div>
              </div>
            </div>

            <div className="mt-px bg-zinc-950 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">DID</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all text-xs leading-6 text-zinc-300">{nodeIdentity.did}</code>
                <button
                  type="button"
                  onClick={() => handleCopy('did', nodeIdentity.did)}
                  className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:border-cyan-300 hover:text-white"
                >
                  {copied === 'did' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-px bg-zinc-950 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">P2P Peer ID</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all text-xs leading-6 text-zinc-300">{nodeIdentity.peerId}</code>
                <button
                  type="button"
                  onClick={() => handleCopy('peer', nodeIdentity.peerId)}
                  className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:border-cyan-300 hover:text-white"
                >
                  {copied === 'peer' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-px bg-zinc-950 p-4">
              <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Protocols</div>
              <div className="flex flex-wrap gap-2">
                {nodeIdentity.protocols.map((protocol) => (
                  <span
                    key={protocol}
                    className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-300"
                  >
                    {protocol}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
