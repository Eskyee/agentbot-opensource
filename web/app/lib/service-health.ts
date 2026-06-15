import { AGENTBOT_BACKEND_URL, SOUL_SERVICE_URL, X402_GATEWAY_URL } from './platform-urls';

const CANONICAL_BORG_URL = 'https://borg-0-production.up.railway.app';
const LEGACY_BORG_URL = 'https://borg-0-production-7139.up.railway.app';

export interface ServiceHealth {
  name: string;
  url: string;
  fallbackUrls?: string[];
}

export interface ServiceStatus {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  detail?: string;
}

export const HEALTH_SERVICES: ServiceHealth[] = [
  { name: 'Agentbot API', url: `${AGENTBOT_BACKEND_URL}/health` },
  {
    name: 'Borg-7139',
    url: `${SOUL_SERVICE_URL}/soul/status`,
    fallbackUrls: [
      `${SOUL_SERVICE_URL}/health`,
      `${SOUL_SERVICE_URL}/healthz`,
      `${SOUL_SERVICE_URL}/readyz`,
      `${CANONICAL_BORG_URL}/soul/status`,
      `${CANONICAL_BORG_URL}/health`,
      `${LEGACY_BORG_URL}/soul/status`,
      `${LEGACY_BORG_URL}/health`,
    ],
  },
  { name: 'x402 Gateway', url: `${X402_GATEWAY_URL}/health` },
];

const HEALTH_CHECK_TIMEOUT_MS = 8000;

function describeFetchError(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as { name?: string; message?: string; cause?: { code?: string } };
    // AbortSignal.timeout throws a DOMException with name="TimeoutError" (Node 20+)
    // or name="AbortError". Surface a clean label instead of the platform's raw
    // "The operation was aborted due to timeout" so the status card stays readable.
    if (err.name === 'TimeoutError' || err.name === 'AbortError' ||
        err.message?.includes('aborted') || err.message?.includes('timeout')) {
      return `timeout (${Math.round(HEALTH_CHECK_TIMEOUT_MS / 1000)}s)`;
    }
    const causeCode = err.cause?.code;
    if (causeCode === 'ENOTFOUND' || causeCode === 'EAI_AGAIN') return 'dns error';
    if (causeCode === 'ECONNREFUSED') return 'connection refused';
    if (causeCode === 'ECONNRESET') return 'connection reset';
    if (causeCode === 'UND_ERR_SOCKET') return 'socket error';
    if (err.message) return err.message;
  }
  return 'unreachable';
}

export async function checkServices(
  services: ServiceHealth[] = HEALTH_SERVICES
): Promise<ServiceStatus[]> {
  return Promise.all(
    services.map(async (service) => {
      const candidates = [service.url, ...(service.fallbackUrls || [])]

      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) {
            continue
          }

          const body = await res.json().catch(() => null)
          const detail =
            typeof body === 'object' && body !== null
              ? ('status' in body && typeof body.status === 'string'
                  ? body.status
                  : 'active' in body
                    ? ((body as { active?: boolean; dormant?: boolean }).active
                        ? ((body as { dormant?: boolean }).dormant ? 'dormant' : 'active')
                        : 'inactive')
                    : 'ready' in body && typeof (body as { ready?: boolean }).ready === 'boolean'
                      ? ((body as { ready?: boolean }).ready ? 'ready' : 'not-ready')
                      : 'build' in body && typeof (body as { build?: string }).build === 'string'
                        ? (body as { build: string }).build
                        : 'ok')
              : 'ok'

          return {
            name: service.name,
            status: 'ok',
            detail,
          }
        } catch {
          // try next candidate
        }
      }

      // If all candidates fail, try the primary one again with a longer timeout for error reporting
      try {
        const res = await fetch(service.url, {
          signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
        });
        if (!res.ok) {
          return { name: service.name, status: 'degraded', detail: `HTTP ${res.status}` };
        }
        const body = await res.json().catch(() => null);
        const detail =
          typeof body === 'object' && body !== null
            ? 'status' in body && typeof body.status === 'string'
              ? body.status
              : 'active' in body
                ? (body as { active?: boolean; dormant?: boolean }).active
                  ? (body as { dormant?: boolean }).dormant
                    ? 'dormant'
                    : 'active'
                  : 'inactive'
                : 'build' in body && typeof body.build === 'string'
                  ? body.build
                  : 'ok'
            : 'ok';
        return {
          name: service.name,
          status: 'ok',
          detail,
        };
      } catch (error: unknown) {
        return { name: service.name, status: 'down', detail: describeFetchError(error) };
      }
    })
  );
}
