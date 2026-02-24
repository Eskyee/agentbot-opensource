'use client'

import { useState, useEffect } from 'react'

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    const res = await fetch('/api/files?agentId=default')
    const data = await res.json()
    setFiles(data.files || [])
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('agentId', 'default')

    await fetch('/api/files', {
      method: 'POST',
      body: formData
    })

    setUploading(false)
    fetchFiles()
  }

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
              <div className="text-2xl font-bold mt-1">0 GB / 10 GB</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Free Tier</div>
              <div className="text-sm text-blue-400 mt-1">Upgrade for 50 GB</div>
            </div>
          </div>
          <div className="mt-4 bg-gray-800 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full w-0"></div>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-400">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file: any) => (
              <div key={file.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{file.filename}</div>
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
