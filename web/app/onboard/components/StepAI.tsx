'use client'

import { useOnboard } from './OnboardContext'

export function StepAI() {
  const { aiProvider, setAiProvider, apiKey, setApiKey, mode, setStep } = useOnboard()

  const providers = [
    { id: 'xiaomi-direct', name: 'MiMo V2.5 Pro', desc: 'Best reasoning, 1M context. Included in your plan — no key needed.', recommended: true },
    { id: 'xiaomi-byok', name: 'Bring Your Own MiMo Key', desc: 'Have a MiMo subscription? Paste your key. 82B credits/month.' },
    { id: 'other', name: 'Other Providers', desc: 'OpenRouter, Anthropic, OpenAI, Groq — Advanced, higher cost' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 4: Bring Your Own Key (BYOK)</h2>
      <p className="text-zinc-400 mb-6">Choose your AI provider and enter your own API key. You pay directly—no markup.</p>
      <div className="space-y-6">
        <div className="space-y-3">
          {providers.map((p) => (
            <button key={p.id} onClick={() => setAiProvider(p.id)}
              className={`w-full text-left p-4 rounded-xl border ${aiProvider === p.id ? 'border-white bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600'} transition-colors`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-zinc-400">{p.desc}</div>
                </div>
                {p.recommended && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">Recommended</span>}
              </div>
            </button>
          ))}
        </div>

        {aiProvider === 'vercel-gateway' && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
            <h3 className="font-semibold mb-2 text-orange-500">Factory Master Infrastructure</h3>
            <p className="text-sm text-zinc-300">The MiMo V2 Pro model is pre-configured via your Vercel AI Gateway. No additional API key is required for the starter tier.</p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-400">
              {['Ultra-low latency inference', 'Optimized for agent reasoning', 'Managed rate limiting'].map((t, i) => (
                <li key={i} className="flex gap-2"><span>✓</span><span>{t}</span></li>
              ))}
            </ul>
          </div>
        )}

        {aiProvider === 'openrouter' && (
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Get your free OpenRouter API key:</h3>
            <ol className="space-y-3 text-zinc-300 text-sm">
              <li className="flex gap-3"><span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span><span>Go to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-white underline">openrouter.ai/keys</a></span></li>
              <li className="flex gap-3"><span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span><span>Sign up with Google (free, no credit card)</span></li>
              <li className="flex gap-3"><span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span><span>Click &quot;Create Key&quot; and copy it</span></li>
            </ol>
          </div>
        )}

        {aiProvider === 'ollama' && (
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-2">Ollama — run models locally</h3>
            <p className="text-sm text-zinc-400 mb-4">Your OpenClaw agent will use the Ollama instance running inside its Railway container. No API key needed.</p>
          </div>
        )}

        {aiProvider === 'gemini' && (
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Get your Gemini API key:</h3>
            <ol className="space-y-3 text-zinc-300 text-sm">
              <li className="flex gap-3"><span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span><span>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-white underline">aistudio.google.com/apikey</a></span></li>
              <li className="flex gap-3"><span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span><span>Sign in with Google and click &quot;Create API key&quot;</span></li>
              <li className="flex gap-3"><span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span><span>Copy the key and paste below</span></li>
            </ol>
          </div>
        )}

        {['openrouter', 'gemini', 'anthropic', 'openai', 'groq'].includes(aiProvider) && (
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
              {aiProvider === 'groq' ? 'Groq API Key (optional - free tier available)' : aiProvider === 'openrouter' ? 'OpenRouter API Key' : aiProvider === 'gemini' ? 'Gemini API Key' : aiProvider === 'anthropic' ? 'Anthropic API Key' : 'OpenAI API Key'}
            </label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder={aiProvider === 'openrouter' ? 'sk-or-v1-...' : aiProvider === 'gemini' ? 'AIza...' : aiProvider === 'anthropic' ? 'sk-ant-...' : aiProvider === 'groq' ? 'gsk_...' : 'sk-...'}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {mode !== 'deploy' && (
            <button onClick={() => setStep('token')} className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto">← Back</button>
          )}
          <button
            onClick={() => mode === 'deploy' ? setStep('deploy') : setStep(aiProvider === 'openrouter' || aiProvider === 'vercel-gateway' ? 'model' : 'skills')}
            disabled={!['openrouter', 'groq', 'ollama', 'vercel-gateway', 'xiaomi-direct'].includes(aiProvider) && !apiKey}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1">
            {mode === 'deploy' ? 'Deploy OpenClaw →' : (aiProvider === 'openrouter' || aiProvider === 'vercel-gateway') ? 'Select Model →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
