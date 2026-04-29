'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import {
  Wrench,
  Star,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
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
  ratingCount: number
  installs: number
  userRating: number | null
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
  const [syncingRuntime, setSyncingRuntime] = useState(false)
  const [runtimeSyncMessage, setRuntimeSyncMessage] = useState<string | null>(null)
  const [ratingSkillId, setRatingSkillId] = useState<string | null>(null)
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
          if (data.code === 'already_installed') {
            setInstalledSkillIds((prev) => new Set(prev).add(skillId))
            toast.info(data.error || 'This skill is already installed')
            return
          }
          if (data.deployWarning?.includes('Gateway unreachable')) {
            throw new Error('Agent offline. Install your agent first, then retry installing skills.')
          }
          throw new Error(data.error || 'Skill install failed. Refresh and try again.')
        }

        setInstalledSkillIds((prev) => new Set(prev).add(skillId))

        if (data.alreadyInstalled) {
          toast.info(data.message || 'This skill is already installed')
          return
        }
        
        if (data.deployed) {
          setRuntimeSyncMessage('Runtime synced. This skill is active on the selected agent.')
          toast.success(
            data.message || (data.runtimeHydrated
              ? 'Skill installed and runtime agent prepared.'
              : 'Skill installed!')
          )
        } else {
          setRuntimeSyncMessage('Skill saved. Runtime sync is pending; use Sync Runtime if it is not active yet.')
          toast.warning(
            data.message || (data.runtimeHydrated
              ? 'Skill saved, but runtime sync still needs attention.'
              : 'Skill saved, but runtime sync still needs attention.')
          )
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Skill install failed. Refresh and try again.'
        toast.error(message)
      } finally {
        setInstallingId(null)
      }
    },
    [selectedAgentId, installedSkillIds]
  )

  const syncRuntime = useCallback(async () => {
    if (!selectedAgentId) {
      toast.error('Select an agent before syncing skills')
      return
    }

    setSyncingRuntime(true)
    try {
      const res = await fetch(`/api/agents/${selectedAgentId}/sync`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Runtime sync failed. Check the agent is online and try again.')
      }

      const deployedCount = data.details?.skillsDeployed
      const message =
        typeof deployedCount === 'number'
          ? `Runtime synced with ${deployedCount} installed skill${deployedCount === 1 ? '' : 's'}.`
          : 'Runtime synced with installed skills.'
      setRuntimeSyncMessage(message)
      toast.success(message)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Runtime sync failed. Check the agent is online and try again.'
      setRuntimeSyncMessage(message)
      toast.error(message)
    } finally {
      setSyncingRuntime(false)
    }
  }, [selectedAgentId])

  const rateSkill = useCallback(async (skillId: string, rating: number) => {
    setRatingSkillId(skillId)
    try {
      const res = await fetch(`/api/skills/${skillId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Rating failed. Sign in and try again.')
      }

      setSkills((prev) =>
        prev.map((skill) =>
          skill.id === skillId
            ? {
                ...skill,
                rating: data.rating,
                ratingCount: data.ratingCount,
                userRating: data.userRating,
              }
            : skill
        )
      )
      toast.success(`Rated ${rating} star${rating === 1 ? '' : 's'}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rating failed. Sign in and try again.'
      toast.error(message)
    } finally {
      setRatingSkillId(null)
    }
  }, [])

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
        icon={<Wrench className="h-5 w-5 text-orange-400" />}
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
          <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Runtime Skills Manager</div>
              <p className="mt-1 text-sm text-zinc-300">
                Open the real OpenClaw skills manager for this agent through the managed control UI, using your paired runtime session.
              </p>
              {runtimeSyncMessage && (
                <p className="mt-2 text-xs text-zinc-400">{runtimeSyncMessage}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={syncRuntime}
                disabled={!selectedAgentId || syncingRuntime}
                className="border-orange-500/40 text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:border-orange-400 hover:text-white"
              >
                <RefreshCw className={`mr-2 h-3 w-3 ${syncingRuntime ? 'animate-spin' : ''}`} />
                {syncingRuntime ? 'Syncing' : 'Sync Runtime'}
              </Button>
              <a
                href={openclawSkillsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-orange-500/40 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:border-orange-400 hover:text-white"
              >
                Open Skills Manager
              </a>
            </div>
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
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                        className="border-orange-500/30 text-orange-400 text-[10px] uppercase tracking-widest"
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
                      <Star className="h-3 w-3" />
                      {skill.ratingCount > 0 ? skill.rating.toFixed(1) : 'No ratings'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" /> {skill.installs} installs
                    </span>
                    <span>by {skill.author}</span>
                  </div>
                  <div className="mb-4 flex items-center justify-between gap-3 border border-zinc-800 bg-black px-3 py-2">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                      {skill.ratingCount > 0
                        ? `${skill.ratingCount} rating${skill.ratingCount === 1 ? '' : 's'}`
                        : 'Be first to rate'}
                    </span>
                    <div className="flex items-center gap-1" aria-label={`Rate ${skill.name}`}>
                      {[1, 2, 3, 4, 5].map((ratingValue) => {
                        const activeRating = skill.userRating || Math.round(skill.rating)
                        const isActive = ratingValue <= activeRating
                        return (
                          <button
                            key={ratingValue}
                            type="button"
                            onClick={() => rateSkill(skill.id, ratingValue)}
                            disabled={ratingSkillId === skill.id}
                            className="p-1 text-zinc-600 transition-colors hover:text-orange-300 disabled:cursor-wait disabled:opacity-60"
                            aria-label={`Rate ${skill.name} ${ratingValue} star${ratingValue === 1 ? '' : 's'}`}
                          >
                            <Star
                              className={`h-4 w-4 ${isActive ? 'fill-orange-400 text-orange-400' : ''}`}
                            />
                          </button>
                        )
                      })}
                    </div>
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
