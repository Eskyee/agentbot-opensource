'use client'

import { useState } from 'react'
import { Sparkles, Zap, Code, ExternalLink, Loader2, Rocket, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want to build')
      return
    }

    setGenerating(true)
    setError(null)
    setGeneratedCode(null)

    try {
      // Simulate AI code generation - in real implementation, call an AI API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate a simple HTML/JS app based on the prompt
      const code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prompt.substring(0, 50)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #9ca3af;
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 1rem;
      padding: 2rem;
      margin: 1rem 0;
    }
    .app-name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #fff;
      margin-bottom: 1rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #6366f1;
      border-radius: 9999px;
      font-size: 0.75rem;
      color: #fff;
      margin-bottom: 1rem;
    }
    .description {
      color: #9ca3af;
      line-height: 1.6;
    }
    .placeholder {
      color: #666;
      font-style: italic;
    }
    .generated-at {
      color: #4b5563;
      font-size: 0.75rem;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Your App: ${prompt.split(' ').slice(0, 3).join(' ')}</h1>
    <div class="card">
      <span class="badge">🚀 Built with Agentbot</span>
      <div class="app-name">${prompt.substring(0, 50)}</div>
      <p class="description">${prompt}</p>
      <p class="placeholder">This is a demo app. Full code generation would create a complete ${prompt.split(' ')[0]} application.</p>
    </div>
    <p style="margin-top: 2rem; color: #6b7280;">
      Want to build this for real? Visit 
      <a href="https://agentbot.com" style="color: #6366f1;">agentbot.com</a> 
      to deploy your app to the world!
    </p>
    <div class="generated-at">
      Generated at ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`

      setGeneratedCode(code)
    } catch (err) {
      setError('Failed to generate app. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-purple-400 text-sm">AI-Powered</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-4">
            Build Anything
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Describe what you want to build. Our AI will generate it instantly.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Build me a dark-themed todo app with drag and drop, reminders, and categories..."
              className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            <div className="absolute bottom-4 right-4 text-zinc-500 text-xs">
              {prompt.length} characters
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Generate App
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Generated Code Preview */}
        {generatedCode && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Generated Code</h2>
              <button
                onClick={() => navigator.clipboard.writeText(generatedCode)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                Copy Code
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                {generatedCode.substring(0, 500)}...
              </pre>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <Lightbulb className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-bold">AI-Powered</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              Describe your app in plain English. Our AI understands and builds it.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <Code className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-bold">Instant Code</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              Get working code in seconds. Copy, modify, and deploy anywhere.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <Rocket className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="font-bold">Deploy Ready</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              One-click deploy to Vercel, Netlify, or your own server.
            </p>
          </div>
        </div>

        {/* Examples */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Try these prompts:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Build a weather dashboard with current conditions',
              'Create a task manager with drag and drop',
              'Make a simple snake game',
              'Build a markdown note-taking app',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="text-left p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-purple-500 transition-colors"
              >
                <span className="text-purple-400 text-sm">→</span>
                <span className="text-zinc-300 ml-2">{example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-zinc-500 mb-4">
            Want full deployment and hosting?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
          >
            Go to Dashboard <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}