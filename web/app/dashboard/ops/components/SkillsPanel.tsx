'use client'

interface Skill {
  name: string
  version: string
  type: string
  calls24h: number
}

interface SkillsPanelProps {
  skills: Skill[]
  agentId?: string
}

const TYPE_COLORS: Record<string, string> = {
  exec: 'bg-green-500/20 text-green-400',
  net: 'bg-blue-500/20 text-blue-400',
  ingest: 'bg-purple-500/20 text-purple-400',
  state: 'bg-yellow-500/20 text-yellow-400',
  egress: 'bg-orange-500/20 text-orange-400',
}

export function SkillsPanel({ skills, agentId }: SkillsPanelProps) {
  if (!agentId) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 p-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Skills</div>
        <div className="text-xs text-zinc-600 text-center py-4">Select an agent</div>
      </div>
    )
  }

  const formatCalls = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Skills · {skills.length} enabled
        </div>
        <button className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-green-400 hover:border-green-500/30 transition-colors">
          + Install
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="text-xs text-zinc-600 text-center py-4">No skills installed</div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center gap-2 px-2 py-1.5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
            >
              <span className="text-[10px] font-mono text-zinc-300 truncate flex-1">{skill.name}</span>
              <span className="text-[10px] font-mono text-zinc-600 shrink-0">{skill.version}</span>
              <span
                className={`px-1 py-0 text-[9px] uppercase tracking-wider font-mono ${
                  TYPE_COLORS[skill.type] || 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {skill.type}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0 text-right w-10">
                {formatCalls(skill.calls24h)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
