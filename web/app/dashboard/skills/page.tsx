'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import {
  Wrench,
  Star,
  Download,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentCard } from '@/app/components/shared/AgentCard'
import { EmptyState } from '@/app/components/shared/EmptyState'
import { buildOpenClawControlUrl } from '@/app/lib/openclaw-control'

interface Skill {
  id: string
  name: string
  description: string
  category: string
  rating: number
  downloads: number
  author: string
  featured?: boolean
}

interface Agent {
  id: string
  name: string
  model: string
  status: string
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<string[]>(['all'])
  const [category, setCategory] = useState('all')
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [installedSkillIds, setInstalledSkillIds] = useState<Set<string>>(
    new Set()
  )
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillDescription, setNewSkillDescription] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState('')
  const [creatingSkill, setCreatingSkill] = useState(false)
  const [openclawSkillsUrl, setOpenclawSkillsUrl] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch agents on mount
  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        const agentList: Agent[] = data.agents || []
        setAgents(agentList)
        if (agentList.length > 0) {
          setSelectedAgentId(agentList[0].id)
        }
      })
      .catch(() => {
        setAgents([])
      })

    fetch('/api/user/openclaw')
      .then((r) => r.json())
      .then((data) => {
        if (!data?.openclawUrl) return
        const normalizedUrl = String(data.openclawUrl).replace(/\/$/, '')
        const gatewayToken = data.gatewayToken ? String(data.gatewayToken) : ''
        const pairedSkillsUrl = buildOpenClawControlUrl({
          view: 'skills',
          gatewayUrl: normalizedUrl,
          gatewayToken,
        })
        setOpenclawSkillsUrl(pairedSkillsUrl)
      })
      .catch(() => {
        setOpenclawSkillsUrl(null)
      })
  }, [])

  const fetchSkills = useCallback(async () => {
    const params = new URLSearchParams()
    params.set('category', category)
    if (selectedAgentId) {
      params.set('agentId', selectedAgentId)
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    }

    try {
      const response = await fetch(`/api/skills?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load skills')
      }
      const data = await response.json()
      setSkills(data.skills || [])
      if (Array.isArray(data.categories)) {
        const cats: string[] = data.categories.filter(
          (c: string) => c && c !== 'all'
        )
        setCategories(['all', ...cats])
      } else {
        setCategories(['all'])
      }

      if (Array.isArray(data.installedSkillIds)) {
        setInstalledSkillIds(new Set(data.installedSkillIds))
      } else {
        setInstalledSkillIds(new Set())
      }
    } catch (error) {
      console.error('Skills fetch error:', error)
      setSkills([])
      setCategories(['all'])
      setInstalledSkillIds(new Set())
    }
  }, [category, selectedAgentId, searchQuery])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const installSkill = useCallback(
    async (skillId: string) => {
      if (!selectedAgentId) {
        toast.error('Select an agent before installing skills')
        return
      }

      if (installedSkillIds.has(skillId)) {
        toast.info('This skill is already installed')
        return
      }

      setInstallingId(skillId)

      try {
        const res = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId, agentId: selectedAgentId }),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          if (data.deployWarning?.includes('Gateway unreachable')) {
            throw new Error('Agent offline. Install your agent first, then retry installing skills.')
          }
          throw new Error(data.error || 'Failed to install skill')
        }

        setInstalledSkillIds((prev) => new Set(prev).add(skillId))
        
        if (data.deployed) {
          toast.success('Skill installed!')
        } else {
          toast.success('Skill saved! It will sync to your agent automatically.')
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to install skill'
        toast.error(message)
      } finally {
        setInstallingId(null)
      }
    },
    [selectedAgentId, installedSkillIds]
  )

  const handleCreateSkill = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedName = newSkillName.trim()
      const trimmedDescription = newSkillDescription.trim()
      const trimmedCategory = newSkillCategory.trim() || 'custom'

      if (!trimmedName || !trimmedDescription) {
        toast.error('Name and description are required')
        return
      }

      setCreatingSkill(true)
      try {
        const response = await fetch('/api/skills/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            description: trimmedDescription,
            category: trimmedCategory,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to add skill')
        }

        toast.success('Skill added!')
        setNewSkillName('')
        setNewSkillDescription('')
        setNewSkillCategory('')
        setCategory('all')
        setIsAddDialogOpen(false)
        await fetchSkills()
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to add skill'
        toast.error(message)
      } finally {
        setCreatingSkill(false)
      }
    },
    [newSkillName, newSkillDescription, newSkillCategory, fetchSkills]
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Skill Marketplace"
        icon={<Wrench className="h-5 w-5 text-blue-400" />}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs font-bold uppercase tracking-wider"
              >
                + Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md">
              <form onSubmit={handleCreateSkill} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">
                    Add a new skill
                  </DialogTitle>
                  <DialogDescription>
                    Describe what the agent should do and assign a category.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="skill-name">Skill Name</Label>
                  <Input
                    id="skill-name"
                    value={newSkillName}
                    onChange={(event) => setNewSkillName(event.target.value)}
                    placeholder="e.g., Energy Meter"
                    maxLength={60}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-description">Description</Label>
                  <textarea
                    id="skill-description"
                    value={newSkillDescription}
                    onChange={(event) =>
                      setNewSkillDescription(event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-mono outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
                    placeholder="Explain what this skill helps agents do."
                    required
                    maxLength={280}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-category">Category</Label>
                  <Input
                    id="skill-category"
                    value={newSkillCategory}
                    onChange={(event) =>
                      setNewSkillCategory(event.target.value)
                    }
                    placeholder="Productivity, finance, streaming..."
                    maxLength={40}
                  />
                </div>
                <DialogFooter className="flex items-center justify-end gap-2">
                  <DialogClose>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    size="sm"
                    className="uppercase tracking-widest text-xs"
                    disabled={creatingSkill}
                  >
                    {creatingSkill ? 'Saving...' : 'Save Skill'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DashboardContent className="max-w-7xl space-y-6">
        {openclawSkillsUrl && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Runtime Skills Manager</div>
              <p className="mt-1 text-sm text-zinc-300">
                Open the real OpenClaw skills manager for this agent through the managed control UI, using your paired runtime session.
              </p>
            </div>
            <a
              href={openclawSkillsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border border-blue-500/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-300 hover:border-blue-400 hover:text-white"
            >
              Open Skills Manager
            </a>
          </div>
        )}

        {/* Agent selector + no-agent banner */}
        {agents.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              You need an agent before installing skills.{' '}
              <a href="/onboard" className="underline text-amber-200 hover:text-white">
                Deploy your first agent →
              </a>
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <label
              htmlFor="agent-select"
              className="text-sm font-medium text-zinc-400"
            >
              Install to:
            </label>
            <select
              id="agent-select"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || agent.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search and Category filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              className={`cursor-pointer capitalize ${
                category === cat
                  ? 'bg-white text-black border-white'
                  : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
          </div>
        </div>

        {/* Skills grid */}
        {skills.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-8 w-8 text-zinc-600" />}
            title="No skills found"
            description="Try a different category or check back later"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => {
              const isInstalled = installedSkillIds.has(skill.id)
              const isInstalling = installingId === skill.id

              return (
                <AgentCard key={skill.id}>
                  <div className="flex items-start gap-2 mb-2">
                    {skill.featured && (
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-widest"
                      >
                        Featured
                      </Badge>
                    )}
                    {isInstalled && (
                      <Badge
                        variant="outline"
                        className="border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Installed
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{skill.name}</h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    {skill.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" /> {skill.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" /> {skill.downloads}
                    </span>
                    <span>by {skill.author}</span>
                  </div>
                  <Button
                    className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isInstalled || isInstalling || !selectedAgentId}
                    onClick={() => installSkill(skill.id)}
                  >
                    {isInstalling
                      ? 'Installing...'
                      : isInstalled
                        ? 'Installed'
                        : 'Install'}
                  </Button>
                  {openclawSkillsUrl && (
                    <a
                      href={openclawSkillsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
                    >
                      Manage in OpenClaw
                    </a>
                  )}
                </AgentCard>
              )
            })}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
