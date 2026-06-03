'use client'

import Link from 'next/link'
import { useOnboard } from './OnboardContext'

export function StepDone() {
  const { mode, result, botInfo, runtimeState, runtimeMessage, accountStats, deploymentStats } = useOnboard()

  if (!result) return null

  return (
    <div>
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">You&apos;re Live!</h2>
      <p className="text-sm text-zinc-400 mb-8">
        {mode === 'deploy'
          ? runtimeState === 'running' ? 'Your OpenClaw business agent is running.' : 'Your managed runtime is provisioning on Railway.'
          : 'Your AI assistant is ready to chat.'}
      </p>

      {mode === 'deploy' ? (
        <>
          <div className="bg-zinc-800 rounded-xl p-6 mb-8 text-left">
            <p className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2"><span className="text-lg">🦞</span> OpenClaw Dashboard</p>
            <div className="mb-4 flex items-center justify-between gap-4 border border-zinc-700 bg-black/20 px-3 py-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Runtime Status</span>
              <span className={`text-[10px] uppercase tracking-widest ${runtimeState === 'running' ? 'text-green-400' : runtimeState === 'provisioning' ? 'text-yellow-400' : 'text-zinc-400'}`}>{runtimeState}</span>
            </div>
            {runtimeMessage && <p className="mb-4 text-xs text-zinc-400">{runtimeMessage}</p>}
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-bold mb-1">Your Instance URL</label>
              <p className="text-sm font-mono bg-black/30 p-2 rounded border border-zinc-700 break-all select-all">{result.url}</p>
            </div>
            <p className="text-[10px] text-zinc-500 mt-4">Bookmark this URL — it&apos;s your OpenClaw control panel.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-8 text-left">
            <div className="bg-zinc-800 rounded-xl p-6">
              <p className="text-sm font-semibold text-zinc-400 mb-4">Account Capacity</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-400">Agents Running</dt><dd>{accountStats?.agents ? `${accountStats.agents.active}/${accountStats.agents.limit}` : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-400">Skills Installed</dt><dd>{accountStats?.skills?.installed ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-400">Tasks Scheduled</dt><dd>{accountStats?.tasks?.total ?? '—'}</dd></div>
              </dl>
            </div>
            <div className="bg-zinc-800 rounded-xl p-6">
              <p className="text-sm font-semibold text-zinc-400 mb-4">Vercel Runtime</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-400">Environment</dt><dd className="uppercase">{deploymentStats?.deployment?.environment ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-400">Region</dt><dd>{deploymentStats?.deployment?.region ?? 'auto'}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-400">Build</dt><dd className="font-mono text-xs">{deploymentStats?.deployment?.commitSha ? deploymentStats.deployment.commitSha.slice(0, 7) : 'latest'}</dd></div>
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="block w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors text-center">
              {runtimeState === 'running' ? 'Open OpenClaw Dashboard →' : 'Open Runtime URL →'}
            </a>
            <a href="/dashboard" className="block w-full bg-zinc-800 py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors text-center">Go to Mission Control</a>
            <Link href="/dashboard/coach" className="block w-full border border-orange-500/50 text-orange-500 py-3 rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-orange-500/10 transition-colors text-center">🎓 Enter Operator Training</Link>
          </div>
        </>
      ) : (
        <>
          <div className="bg-zinc-800 rounded-xl p-6 mb-8 text-left">
            <p className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2"><span className="text-lg">📡</span> Broadcast Credentials (OBS)</p>
            <div className="space-y-4">
              <div><label className="block text-xs text-zinc-500 uppercase font-bold mb-1">Server URL</label><p className="text-sm font-mono bg-black/30 p-2 rounded border border-zinc-700 break-all select-all">rtmps://global-live.mux.com:443/app</p></div>
              <div><label className="block text-xs text-zinc-500 uppercase font-bold mb-1">Stream Key</label><p className="text-sm font-mono bg-black/30 p-2 rounded border border-zinc-700 break-all select-all">{result.streamKey || 'Generating...'}</p></div>
            </div>
            <p className="text-[10px] text-zinc-500 mt-4">Paste these into OBS to start your station. Do not share your Stream Key.</p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 mb-8">
            <p className="text-sm text-zinc-400 mb-2">Open Telegram and message:</p>
            <p className="text-xl font-mono">@{botInfo?.username}</p>
          </div>

          <div className="space-y-4">
            <a href={`https://t.me/${botInfo?.username}`} target="_blank" rel="noopener noreferrer" className="block w-full bg-orange-500 py-3 rounded-lg font-semibold hover:bg-orange-400 transition-colors text-center">Open in Telegram →</a>
            <a href={`/dashboard?id=${result.userId}`} className="block w-full bg-zinc-800 py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors text-center">Go to Dashboard</a>
            <Link href="/dashboard/coach" className="block w-full border border-orange-500/50 text-orange-500 py-3 rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-orange-500/10 transition-colors text-center">🎓 Start Operator Coaching</Link>
          </div>
        </>
      )}
    </div>
  )
}
