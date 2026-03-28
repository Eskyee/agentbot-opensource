import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

/**
 * GET /api/provision/team/templates
 * Returns available team templates and categories for the Team Mode dashboard page.
 */

const TEMPLATES = [
  {
    key: 'music-label-ops',
    name: 'Label Ops',
    description: 'A&R, marketing, and distribution coordination for indie labels.',
    agent_count: 3,
    agents: [
      { name: 'ar-lead', role: 'A&R Lead' },
      { name: 'mktg-agent', role: 'Marketing' },
      { name: 'distro-agent', role: 'Distribution' },
    ],
  },
  {
    key: 'artist-management',
    name: 'Artist Management',
    description: 'Booking, PR, and social media management for artists.',
    agent_count: 3,
    agents: [
      { name: 'booking-agent', role: 'Booking' },
      { name: 'pr-agent', role: 'PR & Press' },
      { name: 'social-agent', role: 'Social Media' },
    ],
  },
  {
    key: 'music-production',
    name: 'Production Suite',
    description: 'Beat research, sample clearance, and release coordination.',
    agent_count: 3,
    agents: [
      { name: 'research-agent', role: 'Beat Research' },
      { name: 'clearance-agent', role: 'Sample Clearance' },
      { name: 'release-agent', role: 'Release Coord' },
    ],
  },
  {
    key: 'dev-fullstack',
    name: 'Full Stack Dev',
    description: 'Frontend, backend, and QA agents for software projects.',
    agent_count: 3,
    agents: [
      { name: 'frontend-agent', role: 'Frontend' },
      { name: 'backend-agent', role: 'Backend' },
      { name: 'qa-agent', role: 'QA' },
    ],
  },
  {
    key: 'content-studio',
    name: 'Content Studio',
    description: 'Writer, editor, and publisher agents for content pipelines.',
    agent_count: 3,
    agents: [
      { name: 'writer-agent', role: 'Writer' },
      { name: 'editor-agent', role: 'Editor' },
      { name: 'publisher-agent', role: 'Publisher' },
    ],
  },
  {
    key: 'event-production',
    name: 'Event Production',
    description: 'Venue research, logistics, and promotion for live events.',
    agent_count: 3,
    agents: [
      { name: 'venue-agent', role: 'Venue Research' },
      { name: 'logistics-agent', role: 'Logistics' },
      { name: 'promo-agent', role: 'Promotion' },
    ],
  },
  {
    key: 'label-expanded',
    name: 'Label (Expanded)',
    description: 'Full label team: A&R, sync, marketing, distribution, legal, finance, social, live, PR.',
    agent_count: 10,
    agents: [
      { name: 'ar-lead', role: 'A&R Lead' },
      { name: 'sync-agent', role: 'Sync & Licensing' },
      { name: 'marketing-agent', role: 'Marketing' },
      { name: 'distro-agent', role: 'Distribution' },
      { name: 'legal-agent', role: 'Legal' },
      { name: 'finance-agent', role: 'Finance' },
      { name: 'social-agent', role: 'Social Media' },
      { name: 'live-agent', role: 'Live Events' },
      { name: 'pr-agent', role: 'PR & Press' },
      { name: 'data-agent', role: 'Data & Analytics' },
    ],
  },
  {
    key: 'dev-enterprise',
    name: 'Enterprise Dev',
    description: 'Architect, frontend, backend, DevOps, security, QA, docs, UX, PM, and analytics.',
    agent_count: 10,
    agents: [
      { name: 'architect-agent', role: 'Architect' },
      { name: 'frontend-agent', role: 'Frontend' },
      { name: 'backend-agent', role: 'Backend' },
      { name: 'devops-agent', role: 'DevOps' },
      { name: 'security-agent', role: 'Security' },
      { name: 'qa-agent', role: 'QA' },
      { name: 'docs-agent', role: 'Documentation' },
      { name: 'ux-agent', role: 'UX Research' },
      { name: 'pm-agent', role: 'Product Manager' },
      { name: 'analytics-agent', role: 'Analytics' },
    ],
  },
]

const CATEGORIES = [
  {
    key: 'music',
    label: 'Music',
    templates: ['music-label-ops', 'artist-management', 'music-production', 'event-production'],
  },
  {
    key: 'developer',
    label: 'Developer',
    templates: ['dev-fullstack', 'dev-enterprise'],
  },
  {
    key: 'content',
    label: 'Content',
    templates: ['content-studio'],
  },
  {
    key: 'label',
    label: 'Label (10 agents)',
    templates: ['label-expanded', 'dev-enterprise'],
  },
]

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ templates: TEMPLATES, categories: CATEGORIES })
}

export const dynamic = 'force-dynamic'
