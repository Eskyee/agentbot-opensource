'use client'

import { useOnboard } from './OnboardContext'

export function StepToken() {
  const { telegramToken, setTelegramToken, error, isValidating, validateToken, setStep } = useOnboard()

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">Step 2: Enter Your Bot Token</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Telegram Bot Token</label>
          <input type="text" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
          <p className="text-sm text-zinc-500 mt-2">Paste the token you received from @BotFather</p>
        </div>
        {error && <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg px-4 py-3 text-red-400">{error}</div>}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button onClick={() => setStep('telegram')} className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto">← Back</button>
          <button onClick={validateToken} disabled={!telegramToken || isValidating} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1">
            {isValidating ? 'Validating...' : 'Validate Token →'}
          </button>
        </div>
      </div>
    </div>
  )
}
