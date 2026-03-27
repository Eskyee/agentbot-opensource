'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, Save, Upload, Download, Undo2, Clock, Eye, Diff, RefreshCw } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface BackupEntry {
  id: string
  timestamp: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNum: number
}

export default function ConfigEditorPage() {
  const [configText, setConfigText] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [backups, setBackups] = useState<BackupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadConfig = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      const text = JSON.stringify(data.config, null, 2)
      setConfigText(text)
      setOriginalText(text)
      setBackups(data.backups || [])
    } catch {
      setError('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const isDirty = configText !== originalText

  const saveConfig = async () => {
    setError('')
    setSuccess('')

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(configText)
    } catch {
      setError('Invalid JSON — fix syntax errors before saving')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }

      const text = JSON.stringify(data.config, null, 2)
      setConfigText(text)
      setOriginalText(text)
      setBackups(data.backups || [])
      setSuccess('Configuration saved — backup created')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Network error — could not save')
    } finally {
      setSaving(false)
    }
  }

  const restoreBackup = async (backupId: string) => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Restore failed')
        return
      }

      const text = JSON.stringify(data.config, null, 2)
      setConfigText(text)
      setOriginalText(text)
      setBackups(data.backups || [])
      setSelectedBackupId(null)
      setShowDiff(false)
      setSuccess(`Restored from backup ${backupId}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Network error — could not restore')
    } finally {
      setSaving(false)
    }
  }

  const exportConfig = () => {
    const blob = new Blob([configText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agentbot-config-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      try {
        JSON.parse(text) // validate
        setConfigText(text)
        setError('')
        setSuccess('Config imported — review and save')
        setTimeout(() => setSuccess(''), 3000)
      } catch {
        setError('Imported file is not valid JSON')
      }
    }
    reader.readAsText(file)
    // Reset file input so same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Simple diff: compare line by line
  const computeDiff = (oldText: string, newText: string): DiffLine[] => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const result: DiffLine[] = []
    let lineNum = 0

    const maxLen = Math.max(oldLines.length, newLines.length)
    for (let i = 0; i < maxLen; i++) {
      lineNum++
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === undefined) {
        result.push({ type: 'added', content: newLine, lineNum })
      } else if (newLine === undefined) {
        result.push({ type: 'removed', content: oldLine, lineNum })
      } else if (oldLine === newLine) {
        result.push({ type: 'unchanged', content: oldLine, lineNum })
      } else {
        result.push({ type: 'removed', content: oldLine, lineNum })
        result.push({ type: 'added', content: newLine, lineNum })
      }
    }
    return result
  }

  const getDiffLines = (): DiffLine[] => {
    if (!selectedBackupId) return []
    // For diff view, we compare current editor text with what's in the backup
    // Since we don't have backup config text in the list, we'll show diff between original (last saved) and current
    return computeDiff(originalText, configText)
  }

  const lineCount = configText.split('\n').length

  return (
    <DashboardShell>
      <DashboardHeader
        title="Config Editor"
        icon={<Settings className="h-5 w-5 text-blue-400" />}
        action={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-[10px] text-yellow-400 bg-yellow-900/20 border border-yellow-800 px-2 py-0.5 font-mono uppercase tracking-widest">
                Unsaved
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <Upload className="h-3 w-3" />
              Import
            </button>
            <button
              onClick={exportConfig}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
            <button
              onClick={saveConfig}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        }
      />

      <DashboardContent className="max-w-7xl">
        {/* Status messages */}
        {error && (
          <div className="mb-4 border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs font-mono text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-xs font-mono text-emerald-400">
            {success}
          </div>
        )}

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Editor */}
          <div className="flex-1 min-w-0">
            <div className="border border-zinc-800 bg-zinc-950">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
                  <Settings className="h-3.5 w-3.5" />
                  Configuration — {lineCount} lines
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className={`flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${
                      showDiff
                        ? 'text-blue-400 bg-blue-950/30 border border-blue-900/50'
                        : 'text-zinc-600 hover:text-white'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    Diff
                  </button>
                </div>
              </div>

              {showDiff && isDirty ? (
                <div className="p-4 font-mono text-xs max-h-[600px] overflow-y-auto">
                  {getDiffLines().map((line, i) => (
                    <div
                      key={i}
                      className={`leading-relaxed ${
                        line.type === 'added'
                          ? 'bg-emerald-950/30 text-emerald-400'
                          : line.type === 'removed'
                          ? 'bg-red-950/30 text-red-400'
                          : 'text-zinc-600'
                      }`}
                    >
                      <span className="inline-block w-10 text-right pr-3 text-zinc-700 select-none">
                        {line.type !== 'added' ? line.lineNum : ''}
                      </span>
                      <span className="inline-block w-4 text-zinc-700 select-none">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                      </span>
                      {line.content}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  {/* Line numbers */}
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-zinc-900/50 border-r border-zinc-800 overflow-hidden select-none pointer-events-none">
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div
                        key={i}
                        className="text-right pr-3 text-[11px] leading-[1.6] text-zinc-700 font-mono"
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={configText}
                    onChange={e => setConfigText(e.target.value)}
                    spellCheck={false}
                    className="w-full bg-zinc-950 text-white text-xs font-mono leading-[1.6] p-4 pl-14 min-h-[500px] max-h-[600px] resize-y focus:outline-none border-0"
                    style={{ tabSize: 2 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Version history sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="border border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-600">
                <Clock className="h-3.5 w-3.5" />
                Version History
              </div>
              {loading ? (
                <div className="p-4 text-xs text-zinc-600 font-mono">Loading...</div>
              ) : backups.length === 0 ? (
                <div className="p-4 text-xs text-zinc-600 font-mono">No backups yet</div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {backups.map(backup => (
                    <div key={backup.id} className="p-3 hover:bg-zinc-900/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-zinc-500 truncate">
                          {backup.id}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-zinc-400 mb-2">
                        {new Date(backup.timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <button
                        onClick={() => restoreBackup(backup.id)}
                        disabled={saving}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                      >
                        <Undo2 className="h-3 w-3" />
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
