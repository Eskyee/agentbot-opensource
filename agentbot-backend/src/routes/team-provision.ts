/**
 * POST /api/provision/team
 * 
 * Provisions a multi-agent team for Collective/Label tiers.
 * Body: { plan: "collective"|"label", templateKey?: string, customAgents?: AgentConfig[] }
 * 
 * Requires authenticated session and active subscription (or admin).
 * Returns teamId + per-agent provision results.
 */

import { Router } from 'express'
import { Pool } from 'pg'
import { authenticate } from '../middleware/auth'
import { provisionTeam, TEAM_TEMPLATES, TEMPLATE_CATEGORIES, PLAN_AGENT_LIMITS, generateTeamYAML, type TeamConfig } from '../lib/team-provisioning'

const router = Router()

// Admin emails (bypass Stripe)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

// DB-backed agent count — survives restarts and horizontal scaling
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Returns the number of active agents for this email from the DB. */
async function getAgentCount(email: string): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS cnt FROM agent_registrations
       WHERE user_id = $1 AND status = 'active'`,
      [email]
    );
    return parseInt(result.rows[0]?.cnt ?? '0', 10);
  } catch {
    return 0; // fail open — let provisioning proceed if DB is unreachable
  }
}

router.post('/', authenticate, async (req, res) => {
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

    // Payment enforcement — only admins bypass, everyone else needs subscription
    const email = ((req as any).userEmail as string) || ''
    const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase())
    const stripeSubscriptionId = (req.body?.stripeSubscriptionId as string) || (req.headers['x-stripe-subscription-id'] as string)

    if (!isAdmin && !stripeSubscriptionId) {
      return res.status(402).json({
        error: 'Active subscription required. Subscribe at /pricing',
        code: 'PAYMENT_REQUIRED',
      })
    }

    // Enforce agent limits per plan — DB-backed for consistency
    if (email) {
      const planLimit = PLAN_AGENT_LIMITS[plan] || 1;
      const currentCount = await getAgentCount(email);
      if (currentCount >= planLimit) {
        return res.status(402).json({
          success: false,
          error: `Agent limit reached. Your ${plan} plan allows ${planLimit} agent${planLimit > 1 ? 's' : ''}. Upgrade to add more.`,
          code: 'AGENT_LIMIT_REACHED',
          current: currentCount,
          limit: planLimit,
        });
      }
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
