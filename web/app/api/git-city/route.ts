/**
 * Git City API — 3D visualization of git commit history
 * 
 * Proxies git-city data and provides endpoints for:
 * - Fetching repository commit data
 * - Generating visualization config
 * - Caching processed data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { z } from 'zod'

const GITHUB_API_BASE = 'https://api.github.com'

// Schema for repository request
const repoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().default('main'),
})

// Schema for user repos request
const userReposSchema = z.object({
  username: z.string().min(1),
  per_page: z.number().default(30),
})

/**
 * GET /api/git-city?owner=xxx&repo=yyy&branch=main
 * Get commit history and generate city data
 */
export async function GET(request: NextRequest) {
  try {
    // Check auth
    const session = await getAuthSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'repo'

    if (type === 'user') {
      // Get user's GitHub repos
      const username = searchParams.get('username')
      if (!username) {
        return NextResponse.json({ error: 'Username required' }, { status: 400 })
      }

      const repos = await fetchGitHubRepos(username)
      return NextResponse.json({ repos })
    }

    // Get repo commits
    const params = repoSchema.parse({
      owner: searchParams.get('owner'),
      repo: searchParams.get('repo'),
      branch: searchParams.get('branch') || 'main',
    })

    const cityData = await generateCityData(params.owner, params.repo, params.branch)
    return NextResponse.json(cityData)

  } catch (error) {
    console.error('[GitCity] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate git city', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/git-city
 * Analyze a custom git repository URL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'Repository URL required' }, { status: 400 })
    }

    // Parse GitHub URL - handle various formats
    // Supports: https://github.com/owner/repo, https://github.com/owner/repo.git, github.com/owner/repo
    const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/)
    if (!githubMatch) {
      return NextResponse.json({ 
        error: 'Invalid GitHub URL', 
        details: 'Please use format: https://github.com/owner/repo' 
      }, { status: 400 })
    }

    const [, owner, repo] = githubMatch
    console.log(`[GitCity] Parsed URL: owner=${owner}, repo=${repo}`)
    
    const cityData = await generateCityData(owner, repo, 'main')
    
    return NextResponse.json(cityData)

  } catch (error) {
    console.error('[GitCity] POST error:', error)
    const errorMessage = (error as Error).message
    
    // Provide helpful error messages for common issues
    let userError = 'Failed to analyze repository'
    if (errorMessage.includes('404')) {
      userError = 'Repository not found. Please check the URL and make sure the repository exists and is public.'
    } else if (errorMessage.includes('403')) {
      userError = 'GitHub API rate limit exceeded. Please try again in a few minutes.'
    } else if (errorMessage.includes('401')) {
      userError = 'Authentication required. This repository may be private.'
    }
    
    return NextResponse.json(
      { error: userError, details: errorMessage },
      { status: 500 }
    )
  }
}

// Fetch user's GitHub repositories
async function fetchGitHubRepos(username: string) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=30`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Agentbot-GitCity',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repos = await response.json()
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      updatedAt: repo.updated_at,
      url: repo.html_url,
    }))
  } catch (error) {
    console.error('[GitCity] Failed to fetch repos:', error)
    return []
  }
}

// Generate city data from git commits
async function generateCityData(owner: string, repo: string, branch: string) {
  try {
    console.log(`[GitCity] Fetching commits for ${owner}/${repo} on branch ${branch}`)
    
    // Fetch commits - try main first, then master if main fails
    let commitsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Agentbot-GitCity',
        },
      }
    )
    
    // If main fails, try master
    if (!commitsResponse.ok && branch === 'main') {
      console.log('[GitCity] Main branch not found, trying master...')
      commitsResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?sha=master&per_page=100`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Agentbot-GitCity',
          },
        }
      )
    }

    if (!commitsResponse.ok) {
      const errorText = await commitsResponse.text()
      console.error(`[GitCity] GitHub API error: ${commitsResponse.status}`, errorText)
      throw new Error(`GitHub API error: ${commitsResponse.status} - ${errorText}`)
    }

    const commits = await commitsResponse.json()
    console.log(`[GitCity] Fetched ${commits.length} commits`)

    // Fetch repo stats
    const repoResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Agentbot-GitCity',
        },
      }
    )

    const repoData = repoResponse.ok ? await repoResponse.json() : null

    // Process commits into city blocks
    const cityBlocks = processCommitsToCityBlocks(commits)

    // Calculate stats
    const stats = calculateStats(commits, repoData)

    return {
      repository: {
        owner,
        repo,
        branch,
        fullName: `${owner}/${repo}`,
        url: `https://github.com/${owner}/${repo}`,
      },
      city: {
        blocks: cityBlocks,
        dimensions: {
          width: Math.ceil(Math.sqrt(cityBlocks.length)) * 2,
          depth: Math.ceil(Math.sqrt(cityBlocks.length)) * 2,
          height: Math.max(...cityBlocks.map(b => b.height), 1),
        },
      },
      stats,
      commits: commits.slice(0, 50).map((c: any) => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message.split('\n')[0],
        author: c.commit.author.name,
        date: c.commit.author.date,
        url: c.html_url,
      })),
    }

  } catch (error) {
    console.error('[GitCity] Generate error:', error)
    throw error
  }
}

// Convert commits to 3D city blocks
function processCommitsToCityBlocks(commits: any[]) {
  const blocks: Array<{
    id: string
    x: number
    z: number
    height: number
    color: string
    type: 'building' | 'park' | 'water' | 'road'
    commitCount: number
    date: string
  }> = []

  // Group commits by date
  const commitsByDate = new Map<string, any[]>()
  commits.forEach(commit => {
    const date = new Date(commit.commit.author.date).toISOString().split('T')[0]
    if (!commitsByDate.has(date)) {
      commitsByDate.set(date, [])
    }
    commitsByDate.get(date)!.push(commit)
  })

  // Generate grid layout
  const dates = Array.from(commitsByDate.keys()).sort()
  const gridSize = Math.ceil(Math.sqrt(dates.length))

  dates.forEach((date, index) => {
    const dayCommits = commitsByDate.get(date)!
    const x = index % gridSize
    const z = Math.floor(index / gridSize)
    
    // Height based on commit count
    const height = Math.min(dayCommits.length * 0.5 + 1, 10)
    
    // Color based on commit intensity
    let color = '#3b82f6' // blue-500
    if (dayCommits.length > 10) color = '#ef4444' // red-500
    else if (dayCommits.length > 5) color = '#f59e0b' // amber-500
    else if (dayCommits.length > 2) color = '#10b981' // emerald-500

    // Determine block type
    let type: 'building' | 'park' | 'water' | 'road' = 'building'
    const dayOfWeek = new Date(date).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      type = dayCommits.length === 0 ? 'park' : 'building'
    }

    blocks.push({
      id: `block-${date}`,
      x: x * 2,
      z: z * 2,
      height,
      color,
      type,
      commitCount: dayCommits.length,
      date,
    })
  })

  return blocks
}

// Calculate repository statistics
function calculateStats(commits: any[], repoData: any | null) {
  const authors = new Map<string, number>()
  
  commits.forEach(commit => {
    const author = commit.commit.author.name
    authors.set(author, (authors.get(author) || 0) + 1)
  })

  return {
    totalCommits: commits.length,
    uniqueContributors: authors.size,
    stars: repoData?.stargazers_count || 0,
    forks: repoData?.forks_count || 0,
    watchers: repoData?.watchers_count || 0,
    language: repoData?.language || 'Unknown',
    topics: repoData?.topics || [],
    license: repoData?.license?.name || null,
    createdAt: repoData?.created_at || null,
    updatedAt: repoData?.updated_at || null,
    description: repoData?.description || '',
  }
}
