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

function getRailwayAuthHeaders(tokenType = getRailwayTokenType()): Record<string, string> {
  const key = getRailwayApiKey()

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

function getRailwayAuthAttempts(): RailwayTokenType[] {
  const configured = getRailwayTokenType()
  if (configured === 'project') return ['project', 'account']
  if (configured === 'account') return ['account', 'project']
  return [configured]
}

function isRailwayUnauthorized(message: string) {
  return /not authorized|unauthorized|forbidden/i.test(message)
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
  let lastError: Error | null = null

  for (const tokenType of getRailwayAuthAttempts()) {
    const res = await fetch(RAILWAY_API, {
      method: 'POST',
      headers: getRailwayAuthHeaders(tokenType),
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const message = `Railway API ${res.status}: ${text}`
      lastError = new Error(message)
      if (isRailwayUnauthorized(message)) continue
      throw lastError
    }

    const json = await res.json() as { data?: T; errors?: { message: string }[] }
    if (json.errors?.length) {
      const message = json.errors.map((entry) => entry.message).join(', ')
      lastError = new Error(message)
      if (isRailwayUnauthorized(message)) continue
      throw lastError
    }

    return json.data as T
  }

  throw lastError || new Error('Railway API authorization failed')
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

function normalizeServiceName(name: string): string {
  return name.trim().toLowerCase()
}

function getServiceNameVariants(name: string): string[] {
  const variants = new Set<string>()
  const normalized = normalizeServiceName(name)
  variants.add(normalized)

  // Railway domains often include "-production" while service names do not.
  if (normalized.endsWith('-production')) {
    variants.add(normalized.replace(/-production$/, ''))
  }

  return [...variants]
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

  const normalizedCandidates = new Set(
    candidates.flatMap((candidate) => getServiceNameVariants(candidate))
  )

  let match = services.find((service) =>
    normalizedCandidates.has(normalizeServiceName(service.name))
  )

  // Fallback: if exact/variant name lookup fails, try contains matching on
  // candidate fragments (useful for service names with extra suffixes).
  if (!match) {
    const fragmentCandidates = [...normalizedCandidates]
      .filter((value) => value.length >= 8)
      .sort((a, b) => b.length - a.length)

    match = services.find((service) => {
      const serviceName = normalizeServiceName(service.name)
      return fragmentCandidates.some((candidate) => serviceName.includes(candidate))
    })
  }

  if (!match) {
    throw new Error(`Managed Railway service not found for ${candidates.join(', ')}`)
  }

  return match
}

export async function deployRailwayServiceImage(params: {
  serviceId: string
  environmentId: string
  image: string
}) {
  await railwayGql(
    `mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }`,
    {
      serviceId: params.serviceId,
      environmentId: params.environmentId,
      input: {
        source: { image: params.image },
      },
    }
  )

  await railwayGql(
    `mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }`,
    {
      serviceId: params.serviceId,
      environmentId: params.environmentId,
    }
  )
}

export async function restartRailwayService(
  serviceId: string,
  environmentId: string
): Promise<void> {
  const projectId = getRailwayProjectId()

  const data = await railwayGql<{
    deployments?: {
      edges?: Array<{ node?: { id: string } | null } | null>
    }
  }>(
    `query LatestDeployment($input: DeploymentListInput!) {
      deployments(input: $input, first: 1) {
        edges { node { id } }
      }
    }`,
    {
      input: {
        projectId,
        serviceId,
        environmentId,
        status: { successfulOnly: true },
      },
    }
  )

  const deploymentId = data.deployments?.edges?.[0]?.node?.id
  if (!deploymentId) {
    throw new Error('No successful deployment found to restart')
  }

  await railwayGql(
    `mutation DeploymentRestart($id: String!) {
      deploymentRestart(id: $id)
    }`,
    { id: deploymentId }
  )
}

export async function deleteRailwayService(serviceId: string): Promise<void> {
  await railwayGql(
    `mutation ServiceDelete($serviceId: String!) {
      serviceDelete(id: $serviceId)
    }`,
    { serviceId }
  )
}
