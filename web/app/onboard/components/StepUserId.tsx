'use client'

import { useOnboard } from './OnboardContext'

export function StepUserId() {
  const { telegramUserId, setTelegramUserId, botInfo, setStep } = useOnboard()

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 3: Your Telegram ID</h2>
      {botInfo && <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>}
      <div className="space-y-6">
        <div className="bg-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">How to get your Telegram ID:</h3>
          <ol className="space-y-4 text-zinc-300">
            {[
              <>Open Telegram and message <code className="bg-zinc-700 px-2 py-0.5 rounded">@userinfobot</code></>,
              <>It will reply with your user ID (a number like <code className="bg-zinc-700 px-2 py-0.5 rounded">123456789</code>)</>,
              <>Copy and paste that number below</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>
        <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="block w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-400 transition-colors">
          Open @userinfobot →
        </a>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Your Telegram User ID</label>
          <input type="text" value={telegramUserId} onChange={(e) => setTelegramUserId(e.target.value.replace(/\D/g, ''))} placeholder="123456789"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
          <p className="text-sm text-zinc-500 mt-2">This ensures only YOU can chat with your bot</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button onClick={() => setStep('token')} className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto">← Back</button>
          <button onClick={() => setStep('agenttype')} disabled={!telegramUserId} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1">Continue →</button>
        </div>
      </div>
    </div>
  )
}
