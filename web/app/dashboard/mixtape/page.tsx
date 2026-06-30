'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Music2, Clock, CheckCircle, Loader2, AlertCircle, Play } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Mixtape {
  id: string
  title: string
  artistName: string | null
  status: string
  playbackId: string | null
  scheduledAt: string | null
  broadcastAt: string | null
  endedAt: string | null
  durationSecs: number | null
  createdAt: string
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending':   return 'Uploading'
    case 'ready':     return 'Ready to broadcast'
    case 'scheduled': return 'Scheduled'
    case 'broadcasting': return 'On air'
    case 'done':      return 'Broadcast complete'
    case 'failed':    return 'Failed'
    default:          return status
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'broadcasting': return 'text-green-400'
    case 'ready':
    case 'scheduled':    return 'text-orange-400'
    case 'done':         return 'text-zinc-500'
    case 'failed':       return 'text-red-400'
    default:             return 'text-amber-400'
  }
}

export default function MixtapePage() {
  const [mixtapes, setMixtapes] = useState<Mixtape[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [title, setTitle] = useState('')
  const [artistName, setArtistName] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadMixtapes() {
    try {
      const res = await fetch('/api/basefm/mixtapes')
      if (res.status === 403) {
        setError('Mix uploads require a Collective plan or higher.')
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setMixtapes(data.mixtapes || [])
    } catch {
      setError('Could not load your mix sets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMixtapes() }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploadError('')
    const file = fileRef.current?.files?.[0]
    if (!file) { setUploadError('Select an audio file first.'); return }
    if (!title.trim()) { setUploadError('Give your mix a title.'); return }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Get Mux upload URL
      const res = await fetch('/api/basefm/mixtapes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), artistName: artistName.trim() || null, scheduledAt: scheduledAt || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || 'Failed to start upload.')
        setUploading(false)
        return
      }

      // Step 2: Upload directly to Mux
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
      }
      await new Promise<void>((resolve, reject) => {
        xhr.open('PUT', data.upload.url)
        xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.send(file)
      })

      // Reset form
      setTitle('')
      setArtistName('')
      setScheduledAt('')
      if (fileRef.current) fileRef.current.value = ''
      setUploadProgress(100)
      await loadMixtapes()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Mix Uploads"
        subtitle="Upload a pre-recorded mix and Agentbot will auto-broadcast it on baseFM."
      />
      <DashboardContent>
        <div className="max-w-2xl space-y-8">

          {/* Upload form */}
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl border border-zinc-700 p-2">
                <Upload className="h-4 w-4 text-zinc-300" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Upload a Mix</p>
                <p className="text-xs text-zinc-500 mt-0.5">MP3, WAV, FLAC — up to 2 hours. Collective plan required.</p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Mix Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Midnight Sessions Vol. 3"
                  disabled={uploading}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Artist / DJ Name</label>
                <input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Your DJ name"
                  disabled={uploading}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Schedule Broadcast (optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={uploading}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-zinc-500">Leave blank to broadcast manually from your dashboard.</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Audio File</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  disabled={uploading}
                  className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border file:border-zinc-700 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-300 file:transition-colors hover:file:border-zinc-600 disabled:opacity-50"
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading — {uploadProgress}%
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-start gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-300">{uploadError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? 'Uploading…' : 'Upload Mix'}
              </button>
            </form>
          </div>

          {/* Mixtape list */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Your Mix Sets</p>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : error ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {error}
              </div>
            ) : mixtapes.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-zinc-800 px-6 py-10 text-center">
                <Music2 className="mx-auto h-7 w-7 text-zinc-500 mb-3" />
                <p className="text-sm text-zinc-500">No mix sets uploaded yet.</p>
                <p className="text-xs text-zinc-500 mt-1">Upload your first mix above — we&apos;ll auto-broadcast it on baseFM.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mixtapes.map((m) => (
                  <div key={m.id} className="rounded-[20px] border border-zinc-800 bg-zinc-950/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{m.title}</p>
                        {m.artistName && <p className="text-xs text-zinc-500 mt-0.5">{m.artistName}</p>}
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] ${statusColor(m.status)}`}>
                        {statusLabel(m.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {m.scheduledAt && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          Scheduled {new Date(m.scheduledAt).toLocaleString()}
                        </div>
                      )}
                      {m.status === 'done' && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Broadcast complete
                        </div>
                      )}
                      {m.playbackId && (
                        <a
                          href={`https://stream.mux.com/${m.playbackId}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-400 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          Playback
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info block */}
          <div className="rounded-[20px] border border-zinc-800/60 bg-zinc-900/40 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">How it works</p>
            <ol className="space-y-1.5 text-xs text-zinc-500 list-decimal list-inside">
              <li>Upload your mix (MP3, WAV, FLAC — up to 2 hours)</li>
              <li>Pick a broadcast time or request an immediate slot</li>
              <li>Agentbot streams your mix live to baseFM via your runtime&apos;s FFmpeg broadcaster</li>
              <li>Listeners tune in on the baseFM live page</li>
            </ol>
            <p className="mt-3 text-xs text-zinc-500">
              Mix uploads are included in Collective plans and above. Storage uses Mux pricing for saved recordings.
            </p>
          </div>

        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
