const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'

type RailwayServiceNode = { id: string; name: string }

function getRailwayApiKey() {
  const key = process.env.RAILWAY_API_KEY?.trim()
  if (!key) throw new Error('RAILWAY_API_KEY not configured')
  return key
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
    headers: {
      Authorization: `Bearer ${getRailwayApiKey()}`,
      'Content-Type': 'application/json',
    },
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
}): Promise<RailwayServiceNode> {
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
