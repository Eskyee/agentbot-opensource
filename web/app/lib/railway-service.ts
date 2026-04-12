const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'

type RailwayServiceNode = { id: string; name: string }
type RailwayTokenType = 'project' | 'workspace' | 'account' | 'oauth'

function getRailwayApiKey() {
  const key = process.env.RAILWAY_API_KEY?.trim()
  if (!key) throw new Error('RAILWAY_API_KEY not configured')
  return key
}

function getRailwayTokenType(): RailwayTokenType {
  const raw = process.env.RAILWAY_TOKEN_TYPE?.trim().toLowerCase()
  if (raw === 'project' || raw === 'workspace' || raw === 'account' || raw === 'oauth') {
    return raw
  }
  return 'account'
}

function getRailwayAuthHeaders() {
  const key = getRailwayApiKey()
  const tokenType = getRailwayTokenType()

  return tokenType === 'project'
    ? {
        'Project-Access-Token': key,
        'Content-Type': 'application/json',
      }
    : {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      }
}

export function getRailwayEnvironmentId() {
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID?.trim()
  if (!environmentId) throw new Error('RAILWAY_ENVIRONMENT_ID not configured')
  return environmentId
}

export function getRailwayProjectId() {
  const projectId = process.env.RAILWAY_PROJECT_ID?.trim()
  if (!projectId) throw new Error('RAILWAY_PROJECT_ID not configured')
  return projectId
}

export async function railwayGql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: getRailwayAuthHeaders(),
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Railway API ${res.status}: ${text}`)
  }

  const json = await res.json() as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) {
    throw new Error(json.errors.map((entry) => entry.message).join(', '))
  }

  return json.data as T
}

function getServiceNameCandidates(agentId?: string | null, openclawUrl?: string | null) {
  const candidates = new Set<string>()

  if (openclawUrl) {
    try {
      const hostname = new URL(openclawUrl).hostname
      const firstLabel = hostname.split('.')[0]
      if (firstLabel) candidates.add(firstLabel)
    } catch {
      // ignore malformed URLs
    }
  }

  if (agentId) {
    candidates.add(`agentbot-agent-${agentId}`)
    candidates.add(agentId)
  }

  return [...candidates]
}

export async function resolveRailwayService(params: {
  agentId?: string | null
  openclawUrl?: string | null
  serviceId?: string | null
}): Promise<RailwayServiceNode> {
  if (params.serviceId) {
    return {
      id: params.serviceId,
      name: params.agentId || params.serviceId,
    }
  }

  const candidates = getServiceNameCandidates(params.agentId, params.openclawUrl)
  if (!candidates.length) throw new Error('No managed service reference found')

  const projectId = getRailwayProjectId()
  const data = await railwayGql<{
    project?: {
      services?: {
        edges?: Array<{ node?: RailwayServiceNode | null } | null>
      }
    }
  }>(
    `query ProjectServices($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }`,
    { projectId }
  )

  const services = (data.project?.services?.edges || [])
    .map((edge) => edge?.node)
    .filter((node): node is RailwayServiceNode => Boolean(node?.id && node?.name))

  const match = services.find((service) => candidates.includes(service.name))
  if (!match) {
    throw new Error(`Managed Railway service not found for ${candidates.join(', ')}`)
  }

  return match
}

export async function deleteRailwayService(serviceId: string): Promise<void> {
  await railwayGql(
    `mutation ServiceDelete($serviceId: String!) {
      serviceDelete(id: $serviceId)
    }`,
    { serviceId }
  )
}
