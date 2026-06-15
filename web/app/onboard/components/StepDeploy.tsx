'use client'

import { useOnboard } from './OnboardContext'
import { AVAILABLE_MODELS } from './types'

export function StepDeploy() {
  const { mode, plan, isPaid, botInfo, aiProvider, selectedModel, selectedSkills, openclawVersion, accountStats, deploymentStats, error, isDeploying, teamMode, setTeamMode, teamTemplate, setTeamTemplate, deploy, setStep } = useOnboard()

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">{mode === 'deploy' ? 'Deploy OpenClaw' : 'Step 7: Deploy Your Assistant'}</h2>
      <div className="space-y-6">
        <div className="bg-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Summary</h3>
          <dl className="space-y-2 text-sm">
            {mode !== 'deploy' && <div className="flex justify-between"><dt className="text-zinc-400">Telegram Bot</dt><dd>@{botInfo?.username}</dd></div>}
            <div className="flex justify-between"><dt className="text-zinc-400">AI Provider</dt><dd>{aiProvider === 'openrouter' ? 'OpenRouter (Free)' : aiProvider === 'gemini' ? 'Google Gemini' : aiProvider === 'groq' ? 'Groq' : aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">AI Model</dt><dd>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">Skills</dt><dd>{selectedSkills.length} selected</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">Plan</dt><dd>{plan === 'free' ? 'Sign up for plan' : plan}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">Payment</dt><dd className={isPaid ? 'text-green-400' : 'text-yellow-400'}>{isPaid ? '✓ Confirmed' : '⚠ Required before deploy'}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">OpenClaw Version</dt><dd className="font-mono">{openclawVersion}</dd></div>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Your Account Snapshot</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-400">Active Agents</dt><dd>{accountStats?.agents ? `${accountStats.agents.active}/${accountStats.agents.limit}` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-400">Total Agents</dt><dd>{accountStats?.agents?.total ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-400">Installed Skills</dt><dd>{accountStats?.skills?.installed ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-400">Scheduled Tasks</dt><dd>{accountStats?.tasks?.total ?? '—'}</dd></div>
            </dl>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Vercel Runtime</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-400">Provider</dt><dd className="uppercase">{deploymentStats?.deployment?.provider ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-400">Environment</dt><dd className="uppercase">{deploymentStats?.deployment?.environment ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-400">Region</dt><dd>{deploymentStats?.deployment?.region ?? 'auto'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-400">Deployment</dt><dd className="truncate font-mono text-xs">{deploymentStats?.deployment?.commitSha ? deploymentStats.deployment.commitSha.slice(0, 7) : 'latest'}</dd></div>
            </dl>
          </div>
        </div>

        {error && <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg px-4 py-3 text-red-400">{error}</div>}

        {(plan === 'collective' || plan === 'label') && (
          <div className="border border-zinc-800 rounded-lg p-4">
            <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Deployment Mode</label>
            <div className="flex gap-3 mb-4">
              <button onClick={() => setTeamMode('single')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border transition-colors ${teamMode === 'single' ? 'border-white text-white bg-white/10' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>Single Agent</button>
              <button onClick={() => setTeamMode('team')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border transition-colors ${teamMode === 'team' ? 'border-white text-white bg-white/10' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>⬢ Team Mode</button>
            </div>
            {teamMode === 'team' && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Team Template</label>
                <select value={teamTemplate} onChange={e => setTeamTemplate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600">
                  <optgroup label="Developer"><option value="dev_team">Dev Team (PM + Engineer + QA)</option><option value="devops_team">DevOps Team (SRE + Infra + Security)</option><option value="api_team">API Team (Architect + Backend + Docs)</option></optgroup>
                  <optgroup label="Creator"><option value="content_team">Content Team (Manager + Writer + Editor)</option><option value="social_media_team">Social Media Team (Strategy + Content + Engagement)</option><option value="research_team">Research Team (Lead + Analyst + Writer)</option></optgroup>
                  <optgroup label="Business"><option value="legal_team">Legal Team (Advisor + Drafter + Compliance)</option><option value="finance_team">Finance Team (Analyst + Accountant + Budget)</option><option value="marketing_team">Marketing Team (Strategist + Copywriter + Growth)</option><option value="sales_team">Sales Team (Manager + Qualifier + AE)</option></optgroup>
                  <optgroup label="Personal"><option value="personal_assistant">Personal Assistant (Scheduler + Researcher + Writer)</option><option value="solopreneur">Solopreneur (Ops + Marketer + Support)</option></optgroup>
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button onClick={() => setStep(mode === 'deploy' ? 'ai' : 'agenttype')} className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto">← Back</button>
          {!isPaid ? (
            <a href={`/api/stripe/checkout?plan=${plan}`} className="w-full block text-left bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors sm:flex-1">💳 Pay to Deploy</a>
          ) : (
            <button onClick={deploy} disabled={isDeploying} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 sm:flex-1">
              {isDeploying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Deploying...
                </span>
              ) : '🚀 Deploy Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
