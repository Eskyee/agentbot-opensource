'use client'

import { useState } from 'react'

export default function TestStreamClient() {
  const [wallet, setWallet] = useState('')
  const [name, setName] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createStream = async () => {
    if (!wallet) {
      setError('Wallet address required')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/basefm/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, name })
      })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const checkLive = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/basefm/live')
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎛️ baseFM Stream Test</h1>

        <div className="space-y-6">
          <div className="bg-zinc-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Create Stream</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Wallet Address</label>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">DJ Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="DJ Test"
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <button
                onClick={createStream}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 rounded-lg py-3 font-semibold"
              >
                {loading ? 'Creating...' : 'Create Stream'}
              </button>
            </div>
          </div>

          <div className="bg-zinc-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Check Live DJs</h2>
            <button
              onClick={checkLive}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 rounded-lg py-3 font-semibold"
            >
              {loading ? 'Loading...' : 'Get Live DJs'}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-zinc-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Result</h2>
              <pre className="bg-black p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}