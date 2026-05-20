/**
 * Fetch deployment history from Railway API for an agent service.
 * Returns restart count, last exit code, and last deploy time.
 */

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2'

async function railwayGql(query: string, variables: Record<string, unknown> = {}) {
  const token = process.env.RAILWAY_API_KEY
  if (!token) return null

  const res = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.data || null
}

export interface AgentDeploymentInfo {
  restartCount: number
  lastExitCode: number | null
  lastExitAt: string | null
  lastDeployAt: string | null
  currentStatus: string | null
}

export async function getAgentDeploymentInfo(serviceId: string): Promise<AgentDeploymentInfo> {
  const empty: AgentDeploymentInfo = {
    restartCount: 0,
    lastExitCode: null,
    lastExitAt: null,
    lastDeployAt: null,
    currentStatus: null,
  }

  try {
    const data = await railwayGql(`
      query ServiceById($id: String!) {
        service(id: $id) {
          id name
          serviceInstances {
            edges {
              node {
                latestDeployment { id status createdAt }
                deployments(first: 30) {
                  edges {
                    node { id status createdAt }
                  }
                }
              }
            }
          }
        }
      }
    `, { id: serviceId })

    if (!data?.service) return empty

    const instance = data.service.serviceInstances?.edges?.[0]?.node
    if (!instance) return empty

    const allDeployments: Array<{ id: string; status: string; createdAt: string }> =
      instance.deployments?.edges?.map((e: { node: { id: string; status: string; createdAt: string } }) => e.node) || []

    const restartCount = allDeployments.filter(
      (d) => d.status === 'CRASHED' || d.status === 'FAILED'
    ).length

    const lastCrash = allDeployments.find(
      (d) => d.status === 'CRASHED' || d.status === 'FAILED'
    )

    const latest = instance.latestDeployment

    return {
      restartCount,
      lastExitCode: lastCrash ? (lastCrash.status === 'CRASHED' ? 137 : 1) : null,
      lastExitAt: lastCrash?.createdAt || null,
      lastDeployAt: latest?.createdAt || null,
      currentStatus: latest?.status || null,
    }
  } catch {
    return empty
  }
}

/**
 * Get the Railway service ID for a user's agent by querying the project services.
 */
export async function getAgentServiceId(userId: string): Promise<string | null> {
  try {
    const projectId = process.env.RAILWAY_PROJECT_ID
    const environmentId = process.env.RAILWAY_ENVIRONMENT_ID
    if (!projectId || !environmentId) return null

    const data = await railwayGql(`
      query ProjectServices($projectId: String!, $environmentId: String!) {
        projectServices(projectId: $projectId, environmentId: $environmentId) {
          edges {
            node { id name }
          }
        }
      }
    `, { projectId, environmentId })

    if (!data?.projectServices?.edges) return null

    // Find the service matching this user's agent
    const agentSuffix = userId.slice(0, 12)
    const service = data.projectServices.edges.find(
      (e: { node: { name: string } }) => e.node.name.includes(agentSuffix)
    )

    return service?.node?.id || null
  } catch {
    return null
  }
}
