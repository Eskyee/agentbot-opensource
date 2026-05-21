'use client'

import { useState } from 'react'

const nodeIdentity = {
  status: 'online',
  network: 'alpha',
  did: 'did:key:z6Mkicjkc95VcFx38Xg2SvFV2ENsu3dLDoWborjPGVodHXoH',
  peerId: '12D3KooWJ8FTHLfbEkXprCACu7qhBazEKzr3ber4JQ3KsGHiRHAe',
  protocols: ['git-smart-http', 'mcp', 'libp2p'],
  nodeUrl: 'https://gitlawb.com/node',
}

const agentbotIdentity = {
  shortId: 'z6MkpUq1',
  did: 'did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY',
  profileUrl: 'https://gitlawb.com/z6MkpUq1',
  repoUrl: 'https://gitlawb.com/node/repos/z6MkpUq1/agentbot-opensource',
  cloneUrl: 'git clone gitlawb://did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY/agentbot-opensource',
  repoName: 'agentbot-opensource',
}

async function copyText(value: string) {
  const textarea = document.createElement('textarea')
  const copyWithTextArea = () => {
    textarea.value = value
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (!copied) throw new Error('Copy command failed')
  }

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
      return
    }
    copyWithTextArea()
  } catch {
    copyWithTextArea()
  }
}

export function GitlawbNodeIdentityCard() {
  const [copied, setCopied] = useState<'node-did' | 'agent-did' | 'peer' | 'clone' | null>(null)

  async function handleCopy(kind: 'node-did' | 'agent-did' | 'peer' | 'clone', value: string) {
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
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 pb-3">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            GitLawb / {agentbotIdentity.shortId} / {agentbotIdentity.repoName}
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest">
            <a href={agentbotIdentity.repoUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">
              repo
            </a>
            <a href={agentbotIdentity.profileUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">
              profile
            </a>
            <a href={nodeIdentity.nodeUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">
              node
            </a>
          </div>
        </div>

        <div className="grid gap-px bg-zinc-900 lg:grid-cols-[.72fr_1.28fr]">
          <div className="bg-black p-5">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-cyan-300">Node Identity</div>
            <h2 className="text-2xl font-bold uppercase tracking-tighter text-white">Agentbot on GitLawb</h2>
            <div className="mt-5 grid gap-px bg-zinc-900 sm:grid-cols-2">
              {[
                ['status', nodeIdentity.status],
                ['network', nodeIdentity.network],
                ['profile', agentbotIdentity.shortId],
                ['repo', agentbotIdentity.repoName],
              ].map(([label, value]) => (
                <div key={label} className="bg-zinc-950 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</div>
                  <div className={`mt-2 text-xs font-bold uppercase tracking-widest ${value === 'online' ? 'text-lime-300' : 'text-zinc-200'}`}>
                    {value === 'online' ? <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-lime-300" /> : null}
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black p-5">
            <div className="grid gap-px bg-zinc-900">
              <div className="bg-zinc-950 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Repository</div>
                <div className="text-sm font-bold uppercase tracking-wider text-white">{agentbotIdentity.shortId}/{agentbotIdentity.repoName}</div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  live mirror details resolve on GitLawb
                </div>
              </div>
              <div className="bg-zinc-950 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Agent DID</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 break-all text-xs leading-6 text-zinc-300">{agentbotIdentity.did}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy('agent-did', agentbotIdentity.did)}
                    className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:border-cyan-300 hover:text-white"
                  >
                    {copied === 'agent-did' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="bg-zinc-950 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Clone Command</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 break-all text-xs leading-6 text-zinc-300">{agentbotIdentity.cloneUrl}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy('clone', agentbotIdentity.cloneUrl)}
                    className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:border-cyan-300 hover:text-white"
                  >
                    {copied === 'clone' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="bg-zinc-950 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Node DID</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 break-all text-xs leading-6 text-zinc-300">{nodeIdentity.did}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy('node-did', nodeIdentity.did)}
                    className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:border-cyan-300 hover:text-white"
                  >
                    {copied === 'node-did' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="bg-zinc-950 p-4">
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
              <div className="bg-zinc-950 p-4">
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
      </div>
    </section>
  )
}
