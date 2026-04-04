export interface HealthSummary {
  status: 'ok'
  timestamp: string
  docker: 'available' | 'unavailable'
  provisioning: 'enabled' | 'disabled'
  provider: 'railway' | 'docker' | 'unknown'
  provisioningProvider: 'railway' | 'docker' | 'none'
  project: string | null
  service: string | null
}

function hasRailwayProvisioningEnv(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    env.RAILWAY_API_KEY?.trim() &&
    env.RAILWAY_PROJECT_ID?.trim() &&
    env.RAILWAY_ENVIRONMENT_ID?.trim()
  )
}

export function buildHealthSummary(params: {
  dockerAvailable: boolean
  env?: NodeJS.ProcessEnv
  now?: Date
}): HealthSummary {
  const env = params.env ?? process.env
  const railwayProvisioning = hasRailwayProvisioningEnv(env)
  const provider: HealthSummary['provider'] = env.RAILWAY_PROJECT_ID?.trim()
    ? 'railway'
    : params.dockerAvailable
      ? 'docker'
      : 'unknown'

  return {
    status: 'ok',
    timestamp: (params.now ?? new Date()).toISOString(),
    docker: params.dockerAvailable ? 'available' : 'unavailable',
    provisioning: railwayProvisioning || params.dockerAvailable ? 'enabled' : 'disabled',
    provider,
    provisioningProvider: railwayProvisioning
      ? 'railway'
      : params.dockerAvailable
        ? 'docker'
        : 'none',
    project: env.RAILWAY_PROJECT_NAME?.trim() || env.RAILWAY_PROJECT_ID?.trim() || null,
    service: env.RAILWAY_SERVICE_NAME?.trim() || env.RENDER_SERVICE_NAME?.trim() || null,
  }
}
