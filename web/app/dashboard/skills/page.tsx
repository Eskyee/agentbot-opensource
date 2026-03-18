'use client'

import { useState, useEffect } from 'react'

export default function SkillsPage() {
  const [skills, setSkills] = useState([])
  const [category, setCategory] = useState('all')

  useEffect(() => {
    fetch(`/api/skills?category=${category}`)
      .then(r => r.json())
      .then(d => setSkills(d.skills || []))
  }, [category])

  const installSkill = async (skillId: string) => {
    await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, agentId: 'default' })
    })
    alert('Skill installed!')
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Skill Marketplace</h1>
          <p className="text-gray-400 mt-2">Browse and install pre-built skills for your agents</p>
        </div>

        <div className="flex gap-3 mb-8">
          {['all', 'music', 'events', 'creative', 'marketing', 'finance', 'channels', 'productivity'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === cat
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill: any) => (
            <div key={skill.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              {skill.featured && (
                <span className="inline-block bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded mb-3">
                  Featured
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{skill.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span>⭐ {skill.rating}</span>
                <span>↓ {skill.downloads}</span>
                <span>by {skill.author}</span>
              </div>
              <button
                onClick={() => installSkill(skill.id)}
                className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
