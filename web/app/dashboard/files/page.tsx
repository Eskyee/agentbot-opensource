'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'

interface AgentFile {
  id: string
  filename?: string
  name?: string
  size: number
  mimeType?: string
  agentId?: string
  createdAt?: string
}

interface Agent {
  id: string
  name: string
  status?: string
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

function getMimeBadge(mimeType?: string): string {
  if (!mimeType) return 'FILE'
  const lower = mimeType.toLowerCase()
  if (lower.includes('pdf')) return 'PDF'
  if (lower.includes('mp3') || lower.includes('mpeg') || lower.includes('audio')) return 'MP3'
  if (lower.includes('mp4') || lower.includes('video')) return 'MP4'
  if (lower.includes('wav')) return 'WAV'
  if (lower.includes('flac')) return 'FLAC'
  if (lower.includes('image/png')) return 'PNG'
  if (lower.includes('image/jpeg') || lower.includes('image/jpg')) return 'JPG'
  if (lower.includes('image/gif')) return 'GIF'
  if (lower.includes('image/webp')) return 'WEBP'
  if (lower.includes('image')) return 'IMG'
  if (lower.includes('json')) return 'JSON'
  if (lower.includes('text')) return 'TXT'
  if (lower.includes('zip') || lower.includes('compressed')) return 'ZIP'
  if (lower.includes('csv')) return 'CSV'
  return 'FILE'
}

function badgeColor(badge: string): string {
  switch (badge) {
    case 'PDF': return 'bg-red-900/50 text-red-400 border-red-800'
    case 'MP3': case 'WAV': case 'FLAC': return 'bg-purple-900/50 text-purple-400 border-purple-800'
    case 'MP4': return 'bg-blue-900/50 text-blue-400 border-blue-800'
    case 'PNG': case 'JPG': case 'GIF': case 'WEBP': case 'IMG': return 'bg-green-900/50 text-green-400 border-green-800'
    case 'JSON': case 'TXT': case 'CSV': return 'bg-yellow-900/50 text-yellow-400 border-yellow-800'
    case 'ZIP': return 'bg-orange-900/50 text-orange-400 border-orange-800'
    default: return 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }
}

export default function FilesPage() {
  const [files, setFiles] = useState<AgentFile[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [storageLimit, setStorageLimit] = useState(10)
  const [toast, setToast] = useState<Toast | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        const agentList: Agent[] = data.agents || data || []
        setAgents(agentList)
        if (agentList.length > 0 && !selectedAgentId) {
          setSelectedAgentId(agentList[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to fetch agents:', e)
    }
  }, [selectedAgentId])

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files')
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      }
    } catch (e) {
      console.error('Failed to fetch files:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStorageLimit = useCallback(async () => {
    try {
      const res = await fetch('/api/user/storage')
      if (res.ok) {
        const data = await res.json()
        setStorageLimit(data.storageLimit || 10)
      }
    } catch (e) {
      console.error('Failed to fetch storage limit:', e)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    fetchFiles()
    fetchStorageLimit()
  }, [fetchAgents, fetchFiles, fetchStorageLimit])

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedAgentId) {
      showToast('Select an agent before uploading.', 'error')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('agentId', selectedAgentId)

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        if (error.error?.includes('not running')) {
          showToast('Your agent is not running. Start it first from the dashboard.', 'error')
        } else {
          showToast(error.error || 'Upload failed', 'error')
        }
      } else {
        showToast('File uploaded successfully', 'success')
      }

      await fetchFiles()
    } catch (e) {
      console.error('Upload error:', e)
      showToast('Upload failed. Please try again.', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const deleteFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(`Delete "${fileName}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(fileId)
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })

      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
        showToast('File deleted', 'success')
      } else {
        const data = await res.json()
        showToast(data.error || 'Delete failed', 'error')
      }
    } catch (e) {
      console.error('Delete error:', e)
      showToast('Delete failed. Please try again.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const upgradeStorage = async () => {
    try {
      const res = await fetch('/api/stripe/storage-upgrade', {
        method: 'POST',
      })

      if (res.ok) {
        const { url } = await res.json()
        if (url) {
          router.push(url)
        } else {
          showToast('Upgrade not available', 'error')
        }
      } else {
        showToast('Failed to create checkout session', 'error')
      }
    } catch (e) {
      console.error('Upgrade error:', e)
      showToast('Something went wrong', 'error')
    }
  }

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0)
  const usedGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2)

  const FileIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )

  const UploadIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )

  const TrashIcon = () => (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )

  // No agents state
  if (!loading && agents.length === 0) {
    return (
      <DashboardShell>
        <DashboardHeader
          title="Agent Files"
          icon={<FileIcon />}
          count={0}
        />
        <DashboardContent className="max-w-6xl space-y-6">
          <div className="border border-zinc-800 bg-zinc-950 py-16 text-center">
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">No agents</p>
            <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest">Deploy one first to manage files</p>
            <Link
              href="/marketplace"
              className="inline-block mt-6 bg-white text-black py-3 px-6 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200"
            >
              Browse Marketplace
            </Link>
          </div>
        </DashboardContent>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Files"
        icon={<FileIcon />}
        count={files.length}
        action={
          <div className="flex items-center gap-3">
            {agents.length > 0 && (
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-white text-xs font-bold uppercase tracking-widest py-3 px-3 appearance-none cursor-pointer focus:outline-none focus:border-zinc-500"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name || agent.id}
                  </option>
                ))}
              </select>
            )}
            <label className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-4 cursor-pointer flex items-center gap-2">
              {uploading ? 'Uploading...' : <><UploadIcon /> Upload File</>}
              <input type="file" onChange={uploadFile} className="hidden" disabled={uploading} />
            </label>
          </div>
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        <SectionHeader
          label="Storage"
          title="Agent Files"
          description="Upload files for your agents to access"
        />

        {/* Toast notification */}
        {toast && (
          <div
            className={`border p-4 text-xs font-bold uppercase tracking-widest ${
              toast.type === 'success'
                ? 'border-green-800 bg-green-950 text-green-400'
                : 'border-red-800 bg-red-950 text-red-400'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Storage bar */}
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Storage Used</div>
              <div className="text-2xl font-bold tracking-tight mt-1">{usedGB} GB / {storageLimit} GB</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">{storageLimit === 10 ? 'Free Tier' : 'Pro Plan'}</div>
              {storageLimit === 10 && (
                <button
                  onClick={upgradeStorage}
                  className="text-[10px] text-blue-400 mt-1 hover:text-blue-300 uppercase tracking-widest font-bold"
                >
                  Upgrade Storage (+50GB)
                </button>
              )}
            </div>
          </div>
          <div className="bg-zinc-800 h-1">
            <div
              className="bg-white h-1"
              style={{ width: `${Math.min((totalSize / (storageLimit * 1024 * 1024 * 1024)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* File list */}
        {loading ? (
          <div className="text-zinc-500 text-xs py-12 text-center">Loading...</div>
        ) : files.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 py-12 text-center">
            <p className="text-zinc-500 text-xs">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-px bg-zinc-800">
            {files.map((file) => {
              const badge = getMimeBadge(file.mimeType)
              const fileName = file.filename || file.name || 'Unnamed'
              return (
                <div key={file.id} className="bg-zinc-950 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 border ${badgeColor(badge)}`}>
                      {badge}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tracking-tight uppercase">{fileName}</span>
                        <a
                          href={`/api/files?download=${file.id}`}
                          className="text-zinc-500 hover:text-white text-sm"
                          title="Download"
                        >
                          ↓
                        </a>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">
                        {(file.size / 1024).toFixed(2)} KB
                        {file.agentId && (
                          <span className="ml-3 text-zinc-600">Agent: {file.agentId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFile(file.id, fileName)}
                    disabled={deletingId === file.id}
                    className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                  >
                    <TrashIcon /> {deletingId === file.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
