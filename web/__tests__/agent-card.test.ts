import { buildAgentCard } from '@/app/lib/agent-card'

describe('agent-card', () => {
  const base = { id: 'agent_1', name: 'Atlas', model: 'mimo-v2.5-pro', status: 'running' }

  it('produces a valid A2A card with default chat skill when no skills installed', () => {
    const card = buildAgentCard(base)
    expect(card.protocolVersion).toBeTruthy()
    expect(card.name).toBe('Atlas')
    expect(card.url).toContain('/api/agents/agent_1/a2a')
    expect(card.skills).toHaveLength(1)
    expect(card.skills[0].id).toBe('chat')
  })

  it('advertises only enabled skills with slugged ids', () => {
    const card = buildAgentCard({
      ...base,
      installedSkills: [
        { enabled: true, skill: { name: 'Venue Finder', description: 'finds venues', category: 'music' } },
        { enabled: false, skill: { name: 'Disabled One', description: 'no', category: 'x' } },
      ],
    })
    expect(card.skills).toHaveLength(1)
    expect(card.skills[0].id).toBe('venue-finder')
    expect(card.skills[0].tags).toContain('music')
  })

  it('exposes the USDC payment rail only when a wallet is provided', () => {
    const without = buildAgentCard(base)
    expect(without['x-agentbot']?.payments).toBeUndefined()

    const withWallet = buildAgentCard(base, { walletAddress: '0xabc', network: 'base' })
    expect(withWallet['x-agentbot']?.payments?.address).toBe('0xabc')
    expect(withWallet['x-agentbot']?.payments?.asset).toBe('USDC')
  })
})
