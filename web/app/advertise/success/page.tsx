'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, Upload } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams  = useSearchParams()
  const campaignId    = searchParams.get('campaign') || ''
  const [uploading,   setUploading]   = useState(false)
  const [uploadDone,  setUploadDone]  = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [progress,    setProgress]    = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploadError('')
    const file = fileRef.current?.files?.[0]
    if (!file) { setUploadError('Select an audio file.'); return }
    setUploading(true)

    // Get Mux upload URL
    const res = await fetch(`/api/ads/campaigns/${campaignId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'request_upload' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setUploadError(data.error || 'Failed to get upload URL.')
      setUploading(false)
      return
    }

    // Upload directly to Mux
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
    }
    await new Promise<void>((resolve, reject) => {
      xhr.open('PUT', data.uploadUrl)
      xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`Upload HTTP ${xhr.status}`)))
      xhr.onerror = () => reject(new Error('Upload network error'))
      xhr.send(file)
    }).catch((err) => {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.')
      setUploading(false)
      throw err
    })

    setUploadDone(true)
    setUploading(false)
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8">

        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Payment confirmed</h1>
          <p className="mt-3 text-zinc-400">
            Your campaign is booked. Now upload your audio ad — we&apos;ll review and schedule your broadcasts within 24 hours.
          </p>
        </div>

        {!uploadDone ? (
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Upload Your Audio Ad</p>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Audio File (MP3, WAV, FLAC)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  disabled={uploading}
                  className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border file:border-zinc-700 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-300 file:transition-colors hover:file:border-zinc-600 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-zinc-600">Max file size 200MB. Audio is transcoded by Mux for broadcast-quality delivery.</p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading — {progress}%
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-sm text-red-400">{uploadError}</p>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? 'Uploading…' : 'Upload Audio'}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-[24px] border border-green-500/20 bg-green-500/5 p-6 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-400 mb-3" />
            <p className="text-sm font-semibold text-white">Audio uploaded successfully</p>
            <p className="mt-2 text-xs text-zinc-500">
              Our team will review your ad and confirm scheduling within 24 hours.
              You&apos;ll receive a confirmation email at the address you provided.
            </p>
          </div>
        )}

        <div className="rounded-[20px] border border-zinc-800/60 bg-zinc-900/40 px-5 py-4 text-xs text-zinc-500 space-y-1.5">
          <p>Campaign ID: <span className="font-mono text-zinc-400">{campaignId}</span></p>
          <p>Keep this for your records. Email us at <span className="text-zinc-400">hello@agentbot.raveculture.xyz</span> if you have questions.</p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/advertise"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Back to advertising
          </Link>
        </div>

      </div>
    </main>
  )
}

export default function AdvertiseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
