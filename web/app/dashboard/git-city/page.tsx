'use client'

import { useState, useMemo, useRef } from 'react'
import { GitBranch, Loader2, ExternalLink, Briefcase, Building as BuildingIcon, Gamepad2, Star, GitFork, Eye, Calendar, Users, Code, Box, List, Share2, Download } from 'lucide-react'
import Link from 'next/link'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box as ThreeBox, Plane, Grid } from '@react-three/drei'
import * as THREE from 'three'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

// 3D Building Component
function CityBuilding({ position, height, color, date, commits, onClick, isSelected }: {
  position: [number, number, number]
  height: number
  color: string
  date: string
  commits: number
  onClick: () => void
  isSelected: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered || isSelected ? 1.1 : 1
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1)
    }
  })

  return (
    <group position={position}>
      <ThreeBox
        ref={meshRef}
        args={[1.2, height, 1.2]}
        position={[0, height / 2, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </ThreeBox>
      {(hovered || isSelected || height > 2) && (
        <Text
          position={[0, height + 0.8, 0]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      )}
      <Text
        position={[0, 0.1, 0.7]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {commits}
      </Text>
    </group>
  )
}

interface RepoStats {
  totalCommits: number
  uniqueContributors: number
  stars: number
  forks: number
  language: string
  watchers: number
  topics: string[]
  license: string
  createdAt: string
  updatedAt: string
  description: string
}

interface Commit {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

interface CityData {
  repository: {
    fullName: string
    url: string
  }
  stats: RepoStats
  commits: Commit[]
}

export default function GitCityPage() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CityData | null>(null)
  const [viewMode, setViewMode] = useState<'list' | '3d'>('list')
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)

  // Process commits into city blocks for 3D visualization
  const cityBlocks = useMemo(() => {
    if (!data?.commits) return []
    
    const blocks: Array<{
      id: string
      position: [number, number, number]
      height: number
      color: string
      date: string
      commits: number
      commitData: Commit[]
    }> = []
    
    // Group commits by date
    const commitsByDate = new Map<string, Commit[]>()
    data.commits.forEach(commit => {
      const date = new Date(commit.date).toISOString().split('T')[0]
      if (!commitsByDate.has(date)) {
        commitsByDate.set(date, [])
      }
      commitsByDate.get(date)!.push(commit)
    })

    // Create grid layout
    const dates = Array.from(commitsByDate.keys()).sort()
    const gridSize = Math.ceil(Math.sqrt(dates.length))
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    dates.forEach((date, index) => {
      const dayCommits = commitsByDate.get(date)!
      const x = (index % gridSize) - gridSize / 2
      const z = Math.floor(index / gridSize) - gridSize / 2
      
      // Height based on commit count (scale factor)
      const height = Math.min(dayCommits.length * 0.3 + 0.5, 8)
      
      // Color based on commit intensity
      let colorIndex = 0
      if (dayCommits.length > 10) colorIndex = 3
      else if (dayCommits.length > 5) colorIndex = 2
      else if (dayCommits.length > 2) colorIndex = 1
      
      blocks.push({
        id: `block-${date}`,
        position: [x * 2, 0, z * 2],
        height,
        color: colors[colorIndex],
        date,
        commits: dayCommits.length,
        commitData: dayCommits.slice(0, 5),
      })
    })

    return blocks
  }, [data])

  const analyzeRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return

    setLoading(true)
    setError(null)
    setData(null)

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

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
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

        <div className="max-w-4xl">
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

          {data && (
            <div className="space-y-6">
              {/* Repo Header */}
              <div className="border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-xl">{data.repository.fullName}</h3>
                    {data.stats.description && (
                      <p className="text-zinc-400 text-sm mt-2">{data.stats.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/dashboard/git-city?owner=${data.repository.fullName.split('/')[0]}&repo=${data.repository.fullName.split('/')[1]}`
                        navigator.clipboard.writeText(url)
                      }}
                      className="p-2 text-zinc-500 hover:text-white transition-colors"
                      title="Share Git City"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <a
                      href={data.repository.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  <StatCard icon={<GitBranch className="h-4 w-4" />} label="Commits" value={data.stats.totalCommits} />
                  <StatCard icon={<Users className="h-4 w-4" />} label="Contributors" value={data.stats.uniqueContributors} />
                  <StatCard icon={<Star className="h-4 w-4" />} label="Stars" value={data.stats.stars} />
                  <StatCard icon={<GitFork className="h-4 w-4" />} label="Forks" value={data.stats.forks} />
                  <StatCard icon={<Eye className="h-4 w-4" />} label="Watchers" value={data.stats.watchers} />
                  <StatCard icon={<Code className="h-4 w-4" />} label="Language" value={data.stats.language} />
                </div>

                {/* Topics */}
                {data.stats.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.stats.topics.map((topic: string) => (
                      <span key={topic} className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                  {data.stats.license && <span>License: {data.stats.license}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created: {formatDate(data.stats.createdAt)}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Updated: {formatDate(data.stats.updatedAt)}</span>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    List View
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      viewMode === '3d' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Box className="h-3.5 w-3.5" />
                    3D City
                  </button>
                </div>
                {viewMode === '3d' && (
                  <p className="text-xs text-zinc-500">
                    🖱️ Drag to rotate • Scroll to zoom • Click buildings
                  </p>
                )}
              </div>

              {/* 3D City View */}
              {viewMode === '3d' && cityBlocks.length > 0 && (
                <div className="border border-zinc-800 bg-black relative" style={{ height: '500px' }}>
                  <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
                    <pointLight position={[0, 10, 0]} intensity={0.5} color="#3b82f6" />
                    
                    <Grid args={[50, 50]} position={[0, 0.01, 0]} />
                    
                    {cityBlocks.map((block) => (
                      <CityBuilding
                        key={block.id}
                        position={block.position}
                        height={block.height}
                        color={block.color}
                        date={block.date}
                        commits={block.commits}
                        onClick={() => setSelectedBlock(block.id)}
                        isSelected={selectedBlock === block.id}
                      />
                    ))}
                    
                    <OrbitControls 
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      minDistance={5}
                      maxDistance={50}
                      maxPolarAngle={Math.PI / 2 - 0.1}
                    />
                  </Canvas>
                </div>
              )}

              {/* Selected Block Details */}
              {viewMode === '3d' && selectedBlock && (
                <div className="border border-blue-800 bg-blue-900/20 p-4">
                  {(() => {
                    const block = cityBlocks.find(b => b.id === selectedBlock)
                    if (!block) return null
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-bold">
                            {new Date(block.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h4>
                          <button 
                            onClick={() => setSelectedBlock(null)}
                            className="text-zinc-500 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-blue-300 text-sm mb-3">
                          {block.commits} commits
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {block.commitData.map((commit, idx) => (
                            <a
                              key={idx}
                              href={commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-black/50 p-2 block hover:bg-black/70"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-zinc-500">{commit.sha.substring(0, 7)}</span>
                                <span className="text-zinc-400">{commit.author}</span>
                              </div>
                              <p className="text-white truncate">{commit.message}</p>
                            </a>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="border border-zinc-800 bg-zinc-900/50">
                  <div className="p-4 border-b border-zinc-800">
                    <h4 className="text-white font-bold text-sm">Recent Commits</h4>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {data.commits.slice(0, 15).map((commit) => (
                      <a
                        key={commit.sha}
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 hover:bg-zinc-800/50 transition-colors block"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{commit.message}</p>
                            <p className="text-zinc-500 text-xs mt-1">
                              <span className="text-blue-400">{commit.sha}</span>
                              {' • '}
                              {commit.author}
                              {' • '}
                              {formatDate(commit.date)}
                            </p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-zinc-600 flex-shrink-0 ml-2" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!data && !loading && !error && (
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-zinc-900/50 p-3">
      <div className="flex items-center gap-2 text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  )
}
