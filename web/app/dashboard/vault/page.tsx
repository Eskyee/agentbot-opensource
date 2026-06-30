'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, File, Trash2, Folder, Search, Lock, Eye, Loader2 } from 'lucide-react'

interface VaultFile {
  id: string
  name: string
  size: number
  type: string
  category: string
  uploadedAt: string
  encrypted: boolean
}

const CATEGORIES = ['All', 'Contracts', 'Invoices', 'Receipts', 'Documents', 'Other']

export default function VaultPage() {
  const [files, setFiles] = useState<VaultFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/vault')
      .then((r) => r.json())
      .then((d) => { if (d.ok && Array.isArray(d.files)) setFiles(d.files) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = files.filter((f) => {
    const matchCategory = activeCategory === 'All' || f.category === activeCategory
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files
    if (!uploaded || uploaded.length === 0) return
    setUploading(true)
    setNotice('')
    const category = activeCategory === 'All' ? 'Other' : activeCategory
    try {
      for (const f of Array.from(uploaded)) {
        const fd = new FormData()
        fd.append('file', f)
        fd.append('category', category)
        const res = await fetch('/api/vault', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data.ok) {
          setFiles((prev) => [data.file, ...prev])
        } else {
          setNotice(data.error || 'Upload failed')
        }
      }
    } catch {
      setNotice('Upload failed — please try again')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const openFile = (id: string) => window.open(`/api/vault/${id}`, '_blank')

  const deleteFile = async (id: string) => {
    if (!confirm('Delete this file permanently?')) return
    setFiles((prev) => prev.filter((f) => f.id !== id))
    try {
      await fetch(`/api/vault/${id}`, { method: 'DELETE' })
    } catch {
      // best-effort; list already updated optimistically
    }
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Storage</div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Vault</h1>
          </div>
          <button onClick={() => fileInput.current?.click()} disabled={uploading} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading' : 'Upload'}
          </button>
          <input ref={fileInput} type="file" multiple onChange={handleUpload} className="hidden" />
        </div>

        {notice && (
          <div className="mb-6 rounded-xl border border-yellow-800 bg-yellow-950/20 p-4 text-xs text-yellow-300">
            {notice}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider rounded border transition-colors ${activeCategory === cat ? 'border-green-500 text-green-400 bg-green-950/30' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Files</div>
            <div className="mt-2 text-2xl font-bold">{files.length}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Total Size</div>
            <div className="mt-2 text-2xl font-bold">{formatSize(files.reduce((s, f) => s + f.size, 0))}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Encrypted</div>
            <div className="mt-2 text-2xl font-bold text-green-400">{files.filter((f) => f.encrypted).length}</div>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-2">
          {loading && (
            <div className="text-center py-12 text-zinc-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading vault…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">{files.length === 0 ? 'Your vault is empty. Upload a document to get started.' : 'No files match your search.'}</p>
            </div>
          )}
          {filtered.map((file) => (
            <div key={file.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <File className="h-5 w-5 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{file.name}</span>
                  {file.encrypted && <Lock className="h-3 w-3 text-green-500 shrink-0" />}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{formatSize(file.size)} · {file.category} · {file.uploadedAt}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openFile(file.id)} title="Open / download" className="p-2 text-zinc-500 hover:text-white transition-colors"><Eye className="h-4 w-4" /></button>
                <button onClick={() => deleteFile(file.id)} title="Delete" className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
