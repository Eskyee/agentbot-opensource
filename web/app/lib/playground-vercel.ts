import type { PlaygroundGeneration } from '@/app/api/playground/projects/_shared'

type VercelDeploymentResponse = {
  id?: string
  url?: string
  readyState?: string
  readySubstate?: string
  state?: string
}

export type PlaygroundVercelDeployment = {
  id: string
  url: string
  state: string
  provider: 'vercel'
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52) || 'agentbot-playground'
}

/**
 * One Vercel project per playground project → stable production URL
 * (https://<name>.vercel.app) that updates on each republish, with no
 * preview-deployment auth wall. The id suffix avoids cross-user collisions.
 */
function stableProjectName(projectName: string, projectId: string) {
  const suffix = projectId.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase() || 'app'
  return `${slugify(`agentbot-play-${projectName}`).slice(0, 44)}-${suffix}`
}

function teamSearch() {
  const search = new URLSearchParams()
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  const teamSlug = process.env.VERCEL_TEAM_SLUG?.trim()
  if (teamId) search.set('teamId', teamId)
  if (!teamId && teamSlug) search.set('slug', teamSlug)
  return search
}

/** Find-or-create the per-project Vercel project. Returns its name. */
async function ensureVercelProject(token: string, name: string): Promise<string> {
  const search = teamSearch()
  const suffix = search.size > 0 ? `?${search.toString()}` : ''

  const existing = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(name)}${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (existing.ok) return name

  const created = await fetch(`https://api.vercel.com/v10/projects${suffix}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, framework: 'vite' }),
    signal: AbortSignal.timeout(20_000),
  })

  if (!created.ok && created.status !== 409) {
    const text = await created.text().catch(() => '')
    throw new Error(`Vercel project create failed with ${created.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
  }

  return name
}

function deploymentUrl(url: string) {
  return url.startsWith('http') ? url : `https://${url}`
}

export function isVercelPlaygroundConfigured() {
  return Boolean(process.env.VERCEL_TOKEN)
}

export async function deployPlaygroundToVercel(params: {
  projectId: string
  projectName: string
  generation: PlaygroundGeneration
}): Promise<PlaygroundVercelDeployment> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    throw new Error('VERCEL_TOKEN is not configured')
  }

  const projectName = stableProjectName(params.projectName, params.projectId)
  await ensureVercelProject(token, projectName)

  const search = teamSearch()
  search.set('forceNew', '1')
  search.set('skipAutoDetectionConfirmation', '1')

  const hasVercelConfig = params.generation.files.some((file) => file.path === 'vercel.json')
  const files = [
    ...params.generation.files,
    ...(!hasVercelConfig
      ? [{
          path: 'vercel.json',
          language: 'json',
          content: JSON.stringify({
            framework: 'vite',
            buildCommand: 'npm run build',
            installCommand: 'npm install',
            outputDirectory: 'dist',
          }, null, 2),
        }]
      : []),
  ].map((file) => ({
    file: file.path,
    data: file.content,
    encoding: 'utf-8',
  }))

  const response = await fetch(`https://api.vercel.com/v13/deployments?${search.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      project: projectName,
      // Production target on the per-project Vercel project → stable URL,
      // no preview-deployment auth wall.
      target: 'production',
      files,
      projectSettings: {
        framework: 'vite',
        installCommand: 'npm install',
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
        nodeVersion: '22.x',
      },
      meta: {
        agentbot: 'playground',
        playgroundProjectId: params.projectId,
      },
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Vercel deployment failed with ${response.status}${text ? `: ${text.slice(0, 400)}` : ''}`)
  }

  const deployment = await response.json() as VercelDeploymentResponse
  if (!deployment.id || !deployment.url) {
    throw new Error('Vercel deployment response did not include an id and url')
  }

  return {
    id: deployment.id,
    // Stable production alias rather than the per-deployment hash URL
    url: `https://${projectName}.vercel.app`,
    state: deployment.readyState || deployment.readySubstate || deployment.state || 'QUEUED',
    provider: 'vercel',
  }
}

export async function getPlaygroundVercelDeployment(deploymentId: string): Promise<PlaygroundVercelDeployment> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    throw new Error('VERCEL_TOKEN is not configured')
  }

  const search = new URLSearchParams()
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  const teamSlug = process.env.VERCEL_TEAM_SLUG?.trim()
  if (teamId) search.set('teamId', teamId)
  if (!teamId && teamSlug) search.set('slug', teamSlug)

  const suffix = search.size > 0 ? `?${search.toString()}` : ''
  const response = await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Vercel deployment status failed with ${response.status}${text ? `: ${text.slice(0, 400)}` : ''}`)
  }

  const deployment = await response.json() as VercelDeploymentResponse
  if (!deployment.id || !deployment.url) {
    throw new Error('Vercel deployment status response did not include an id and url')
  }

  return {
    id: deployment.id,
    url: deploymentUrl(deployment.url),
    state: deployment.readyState || deployment.readySubstate || deployment.state || 'UNKNOWN',
    provider: 'vercel',
  }
}
