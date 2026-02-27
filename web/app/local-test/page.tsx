'use client'

import { useState } from 'react'

export default function LocalTestPage() {
  const [telegramToken, setTelegramToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const deploy = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken,
          apiKey,
          plan: 'starter'
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Deployment failed')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to deploy')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">Local Deploy Test</h1>
        
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Telegram Bot Token</label>
            <input
              type="text"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">OpenRouter API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <button
            onClick={deploy}
            disabled={loading || !telegramToken}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            {loading ? 'Deploying...' : 'Deploy Agent'}
          </button>

          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-900/50 border border-green-800 text-green-200 p-4 rounded-lg">
              <p className="font-medium">Deployed!</p>
              <p>User ID: {result.userId}</p>
              <p>URL: <a href={result.url} className="underline">{result.url}</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
