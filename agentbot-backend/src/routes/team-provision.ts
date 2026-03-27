/**
 * POST /api/provision/team
 * 
 * Provisions a multi-agent team for Collective/Label tiers.
 * Body: { plan: "collective"|"label", templateKey?: string, customAgents?: AgentConfig[] }
 * 
 * Requires authenticated session. Returns teamId + per-agent provision results.
 */

import { Router } from 'express'
import { provisionTeam, TEAM_TEMPLATES, TEMPLATE_CATEGORIES, generateTeamYAML, type TeamConfig } from '../lib/team-provisioning'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const userId = (req as any).userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { plan, templateKey = 'dev_team', customAgents } = req.body

    if (!plan || !['collective', 'label', 'network'].includes(plan)) {
      return res.status(400).json({
        error: 'Team provisioning requires collect, label, or network plan',
        available_templates: Object.keys(TEAM_TEMPLATES),
      })
    }

    const result = await provisionTeam(userId, plan, templateKey, customAgents)

    res.json({
      success: true,
      teamId: result.teamId,
      template: result.template.name,
      agents: result.agents.map((a) => ({
        container: a.container,
        status: a.status,
        url: a.url,
      })),
      yaml_config: generateTeamYAML(result.template),
    })
  } catch (err: any) {
    console.error('[TeamProvision] Error:', err)
    res.status(500).json({
      error: err.message || 'Team provisioning failed',
    })
  }
})

// List available team templates (grouped by category)
router.get('/templates', (_req, res) => {
  const templates = (Object.entries(TEAM_TEMPLATES) as [string, TeamConfig][]).map(([key, t]) => ({
    key,
    name: t.name,
    description: t.description,
    agent_count: t.agents.length,
    agents: t.agents.map((a) => ({
      name: a.name,
      role: a.role,
    })),
  }))

  const categories = Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => ({
    key,
    label: cat.label,
    templates: cat.templates,
  }))

  res.json({ templates, categories })
})

export default router
