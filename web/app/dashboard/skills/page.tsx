'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, Star, Download, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentCard } from '@/app/components/shared/AgentCard'
import { EmptyState } from '@/app/components/shared/EmptyState'

const CATEGORIES = [
  'all',
  'music',
  'events',
  'creative',
  'marketing',
  'finance',
  'channels',
  'productivity',
]

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([])
  const [category, setCategory] = useState('all')

  useEffect(() => {
    fetch(`/api/skills?category=${category}`)
      .then((r) => r.json())
      .then((d) => setSkills(d.skills || []))
  }, [category])

  const installSkill = async (skillId: string) => {
    await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, agentId: 'default' }),
    })
    alert('Skill installed!')
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Skill Marketplace"
        icon={<Wrench className="h-5 w-5 text-blue-400" />}
      />

      <DashboardContent className="max-w-7xl space-y-6">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
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

        {/* Skills grid */}
        {skills.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-8 w-8 text-zinc-600" />}
            title="No skills found"
            description="Try a different category or check back later"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill: any) => (
              <AgentCard key={skill.id}>
                {skill.featured && (
                  <Badge
                    variant="outline"
                    className="mb-3 border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-widest"
                  >
                    Featured
                  </Badge>
                )}
                <h3 className="text-lg font-bold mb-2">{skill.name}</h3>
                <p className="text-sm text-zinc-400 mb-4">{skill.description}</p>
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
                  className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest"
                  onClick={() => installSkill(skill.id)}
                >
                  Install
                </Button>
              </AgentCard>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
