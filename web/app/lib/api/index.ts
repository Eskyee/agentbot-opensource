/**
 * Shared API helper layer. Import from one place:
 *
 *   import { apiOk, apiError, withRateLimit, safeFetch, readJson } from '@/app/lib/api'
 */
export {
  apiError,
  apiOk,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
  invalidBody,
  type ApiErrorBody,
} from './respond'
export { withRateLimit, checkRateLimit, type RateCategory } from './rate-limit'
export { safeFetch, FetchTimeoutError } from './fetch'
export { readJson } from './body'
