'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ApiKeysTabProps {
  agents: { id: string; name: string; status: string }[]
}

export function ApiKeysTab({ agents }: ApiKeysTabProps) {
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created: string }[]>([])
  const hasLiveAgent = agents.length > 0

  const createApiKey = async () => {
    const name = prompt('Enter a name for this API key:')
    if (!name) return

    const newKey = {
      id: Date.now().toString(),
      name,
      key: `ab_key_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0],
    }

    setApiKeys([...apiKeys, newKey])
    alert(`API Key created: ${newKey.key}`)
  }

  const deleteApiKey = (id: string) => {
    if (!confirm('Delete this API key?')) return
    setApiKeys(apiKeys.filter((k) => k.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base sm:text-xl font-semibold">API Keys</h2>
        {hasLiveAgent && (
          <button
            onClick={createApiKey}
            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            + Create Key
          </button>
        )}
      </div>

      {!hasLiveAgent ? (
        <div className="border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 text-left">
          <div className="text-4xl mb-4">🔑</div>
          <h3 className="text-base sm:text-lg font-medium mb-2">No Managed Runtime Found</h3>
          <p className="text-zinc-400 text-sm mb-6">
            API keys unlock advanced runtime integrations. Once your managed OpenClaw runtime is provisioned, you can create and rotate keys here.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Name</th>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Key</th>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Created</th>
                <th className="text-right p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 sm:p-8 text-left text-zinc-500 text-sm">
                    No API keys created yet.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="border-t border-zinc-800">
                    <td className="p-3 sm:p-4 text-sm font-medium">{key.name}</td>
                    <td className="p-3 sm:p-4 font-mono text-xs text-zinc-400 max-w-[140px] truncate">{key.key}</td>
                    <td className="p-3 sm:p-4 text-xs text-zinc-400">{key.created}</td>
                    <td className="p-3 sm:p-4 text-right">
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="text-red-400 hover:text-red-300 text-xs uppercase tracking-widest font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
