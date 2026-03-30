'use client'

import { memo } from 'react'
import Link from 'next/link'

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
}

interface Agent {
  id: string
  name: string
  status: string
}

interface ApiKeysTabProps {
  apiKeys: ApiKey[]
  agents: Agent[]
  onCreateKey: () => void
  onDeleteKey: (id: string) => void
}

const ApiKeysTab = memo(function ApiKeysTab({ apiKeys, agents, onCreateKey, onDeleteKey }: ApiKeysTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base sm:text-xl font-semibold">API Keys</h2>
        {agents.length > 0 && (
          <button
            onClick={onCreateKey}
            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            + Create Key
          </button>
        )}
      </div>

      {agents.length === 0 ? (
        <div className="border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 text-left">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-base sm:text-lg font-medium mb-2">No Agents Deployed</h3>
          <p className="text-zinc-400 text-sm mb-6">
            API keys are only available once you have a live agent.
            Deploy your first agent from the marketplace to get started.
          </p>
          <Link href="/marketplace" className="inline-block bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
            Go to Marketplace
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
                        onClick={() => onDeleteKey(key.id)}
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
})

export default ApiKeysTab
