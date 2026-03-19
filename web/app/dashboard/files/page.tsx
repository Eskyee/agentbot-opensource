'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Files</h1>
            <p className="text-gray-400 mt-2">Upload files for your agent to access</p>
          </div>
          <label className="bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer">
            {uploading ? 'Uploading...' : '+ Upload File'}
            <input type="file" onChange={uploadFile} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Storage Used</div>
              <div className="text-2xl font-bold mt-1">{usedGB} GB / {storageLimit} GB</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">{storageLimit === 10 ? 'Free Tier' : 'Pro Plan'}</div>
              {storageLimit === 10 && (
                <button 
                  onClick={upgradeStorage}
                  className="text-sm text-blue-400 mt-1 hover:text-blue-300 transition-colors"
                >
                  Upgrade Storage (+50GB)
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 bg-gray-800 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${Math.min((totalSize / (storageLimit * 1024 * 1024 * 1024)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-400">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file: any, i: number) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</div>
                </div>
                <button className="text-red-400 hover:text-red-300">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
