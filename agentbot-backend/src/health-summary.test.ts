import { buildHealthSummary } from './lib/health-summary';

describe('buildHealthSummary', () => {
  const now = new Date('2026-04-04T17:45:00.000Z');

  it('reports railway provisioning when railway env vars are present', () => {
    const summary = buildHealthSummary({
      dockerAvailable: false,
      now,
      env: {
        RAILWAY_API_KEY: 'rw_token',
        RAILWAY_PROJECT_ID: 'proj_123',
        RAILWAY_ENVIRONMENT_ID: 'env_123',
        RAILWAY_PROJECT_NAME: 'motivated-comfort',
        RAILWAY_SERVICE_NAME: 'agentbot-backend',
      } as NodeJS.ProcessEnv,
    });

    expect(summary).toMatchObject({
      status: 'ok',
      docker: 'unavailable',
      provisioning: 'enabled',
      provider: 'railway',
      provisioningProvider: 'railway',
      project: 'motivated-comfort',
      service: 'agentbot-backend',
      timestamp: '2026-04-04T17:45:00.000Z',
    });
  });

  it('falls back to docker when only docker provisioning is available', () => {
    const summary = buildHealthSummary({
      dockerAvailable: true,
      now,
      env: {} as NodeJS.ProcessEnv,
    });

    expect(summary).toMatchObject({
      provisioning: 'enabled',
      provider: 'docker',
      provisioningProvider: 'docker',
      project: null,
      service: null,
    });
  });
});
