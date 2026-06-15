'use client'

import { useOnboard } from './OnboardContext'

export function StepTelegram() {
  const { setStep } = useOnboard()

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">Step 1: Create Telegram Bot</h2>
      <div className="space-y-6">
        <div className="bg-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Follow these steps:</h3>
          <ol className="space-y-4 text-zinc-300">
            {[
              <>Open Telegram and search for <code className="bg-zinc-700 px-2 py-0.5 rounded">@BotFather</code></>,
              <>Send the command <code className="bg-zinc-700 px-2 py-0.5 rounded">/newbot</code></>,
              <>Choose a name for your bot (e.g., &quot;My AI Assistant&quot;)</>,
              <>Choose a username ending in <code className="bg-zinc-700 px-2 py-0.5 rounded">_bot</code></>,
              <>Copy the <strong>API token</strong> BotFather gives you</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>
        <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="block w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-400 transition-colors">
          Open @BotFather →
        </a>
        <button onClick={() => setStep('token')} className="block w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors">
          I have my token →
        </button>
      </div>
    </div>
  )
}
