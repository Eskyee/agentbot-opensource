'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [storageLimit, setStorageLimit] = useState(10)
  const router = useRouter()

  useEffect(() => {
    fetchFiles()
    fetchStorageLimit()
  }, [])

  const fetchStorageLimit = async () => {
    try {
      const res = await fetch('/api/user/storage')
      if (res.ok) {
        const data = await res.json()
        setStorageLimit(data.storageLimit || 10)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files?agentId=default')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('agentId', 'default')

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const error = await res.json()
        if (error.error?.includes('not running')) {
          alert('Your agent is not running. Start it first from the dashboard.')
        } else {
          alert(error.error || 'Upload failed')
        }
      }
      
      fetchFiles()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  const upgradeStorage = async () => {
    const res = await fetch('/api/stripe/storage-upgrade', {
      method: 'POST'
    })
    
    if (res.ok) {
      const { url } = await res.json()
      if (url) {
        router.push(url)
      } else {
        alert('Upgrade not available')
      }
    } else {
      alert('Failed to create checkout session')
    }
  }

  const totalSize = files.reduce((acc: number, f: any) => acc + (f.size || 0), 0)
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

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Files"
        icon={<FileIcon />}
        count={files.length}
        action={
          <label className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-4 cursor-pointer flex items-center gap-2">
            {uploading ? 'Uploading...' : <><UploadIcon /> Upload File</>}
            <input type="file" onChange={uploadFile} className="hidden" disabled={uploading} />
          </label>
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        <SectionHeader
          label="Storage"
          title="Agent Files"
          description="Upload files for your agent to access"
        />

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
            {files.map((file: any, i: number) => (
              <div key={i} className="bg-zinc-950 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold tracking-tight uppercase">{file.filename || file.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{(file.size / 1024).toFixed(2)} KB</div>
                </div>
                <button className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <TrashIcon /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
