'use client'

import { useState, useEffect } from 'react'

const PERSONALITIES = [
  { id: 'basement', name: 'Basement', tone: 'dark & hypnotic', emoji: '🔮', description: 'Underground techno energy. Minimal, hypnotic, warehouse vibes.' },
  { id: 'selector', name: 'Selector', tone: 'DJ & curation', emoji: '🎧', description: 'Track recommendations, setlists, BPM matching. Always reading the room.' },
  { id: 'ar', name: 'A&R', tone: 'industry & discovery', emoji: '🎤', description: 'Finding the next hits. Connecting artists, labels, and opportunities.' },
  { id: 'road', name: 'Road', tone: 'logistics & touring', emoji: '🚛', description: 'Buses, venues, rider requirements. Making sure the show goes on.' },
  { id: 'label', name: 'Label', tone: 'operations & roster', emoji: '🏷️', description: 'Release schedules, royalty splits, catalog management.' },
]

export default function PersonalityPage() {
  const [selected, setSelected] = useState('professional')
  const [customGreeting, setCustomGreeting] = useState('')
  const [expertise, setExpertise] = useState('')

  const savePersonality = async () => {
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'default',
        key: 'personality',
        value: JSON.stringify({
          type: selected,
          greeting: customGreeting,
          expertise
        })
      })
    })
    alert('Personality saved!')
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Agent Personality</h1>
          <p className="text-gray-400 mt-2">Customize how your agent communicates</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Choose Personality Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {PERSONALITIES.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selected === p.id
                    ? 'border-white bg-gray-800'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-400">{p.tone}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Custom Greeting</h2>
          <input
            type="text"
            value={customGreeting}
            onChange={(e) => setCustomGreeting(e.target.value)}
            placeholder="Hello! How can I assist you today?"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Area of Expertise</h2>
          <input
            type="text"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="e.g., customer support, data analysis, content writing"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
          />
        </div>

        <button
          onClick={savePersonality}
          className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Save Personality
        </button>
      </div>
    </div>
  )
}
