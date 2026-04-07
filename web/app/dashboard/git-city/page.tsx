'use client'

import { useState } from 'react'
import { GitBranch, Loader2, ExternalLink, Briefcase, Building, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface RepoStats {
  totalCommits: number
  uniqueContributors: number
  stars: number
  forks: number
  language: string
}

export default function GitCityPage() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<RepoStats | null>(null)
  const [repoName, setRepoName] = useState('')

  const analyzeRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return

    setLoading(true)
    setError(null)
    setStats(null)

    try {
      const response = await fetch('/api/git-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repoUrl }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to analyze repository')
      }

      const data = await response.json()
      setStats(data.stats)
      setRepoName(data.repository.fullName)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Git City"
        icon={<GitBranch className="h-5 w-5 text-blue-400" />}
      />

      <DashboardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/jobs"
            className="border border-green-800 bg-green-900/20 p-4 hover:border-green-600 transition-colors"
          >
            <Briefcase className="h-6 w-6 text-green-400 mb-2" />
            <h3 className="text-white font-bold">Jobs Board</h3>
            <p className="text-zinc-400 text-xs mt-1">Find dev jobs or post listings</p>
          </Link>
          
          <a
            href="https://www.thegitcity.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-blue-800 bg-blue-900/20 p-4 hover:border-blue-600 transition-colors"
          >
            <GitBranch className="h-6 w-6 text-blue-400 mb-2" />
            <h3 className="text-white font-bold">3D City</h3>
            <p className="text-zinc-400 text-xs mt-1">Visit the virtual city</p>
            <ExternalLink className="h-3 w-3 text-zinc-500 mt-2" />
          </a>
          
          <Link
            href="/dashboard/git-city"
            className="border border-purple-800 bg-purple-900/20 p-4 hover:border-purple-600 transition-colors"
          >
            <Gamepad2 className="h-6 w-6 text-purple-400 mb-2" />
            <h3 className="text-white font-bold">Arcade</h3>
            <p className="text-zinc-400 text-xs mt-1">Pixel games & achievements</p>
          </Link>
        </div>

        <div className="max-w-2xl">
          <p className="text-zinc-400 text-sm mb-6">
            Visualize your GitHub repositories. Enter a GitHub repo URL to see commit history, 
            contributor stats, and more.
          </p>

          <form onSubmit={analyzeRepo} className="space-y-4 mb-8">
            <div className="flex gap-2">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !repoUrl}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest px-6 py-2 transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Analyze
              </button>
            </div>
          </form>

          {error && (
            <div className="border border-red-800 bg-red-900/20 p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {stats && (
            <div className="border border-zinc-800 bg-zinc-900/50">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-bold">{repoName}</h3>
                <a
                  href={`https://github.com/${repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800">
                <div className="bg-zinc-950 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Commits</div>
                  <div className="text-xl font-bold">{stats.totalCommits}</div>
                </div>
                <div className="bg-zinc-950 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Contributors</div>
                  <div className="text-xl font-bold">{stats.uniqueContributors}</div>
                </div>
                <div className="bg-zinc-950 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Stars</div>
                  <div className="text-xl font-bold">{stats.stars}</div>
                </div>
                <div className="bg-zinc-950 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Language</div>
                  <div className="text-xl font-bold">{stats.language}</div>
                </div>
              </div>
            </div>
          )}

          {!stats && !loading && !error && (
            <div className="text-center py-12 border border-dashed border-zinc-800">
              <GitBranch className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-600 text-sm">Enter a GitHub repository URL to get started</p>
              <p className="text-zinc-700 text-xs mt-1">Example: https://github.com/Eskyee/agentbot</p>
            </div>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
