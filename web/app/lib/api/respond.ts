/**
 * Consistent API response envelope.
 *
 * One error shape across every route — `{ error: { message, code } }` — so the
 * Postman collection and external consumers can rely on it. `apiError` never
 * leaks raw exception text unless you pass it explicitly.
 *
 *   return apiError('Project not found', 404, 'not_found')
 *   return apiOk({ project })
 *   return apiError.from(err, 500)   // safe: logs detail, returns generic message
 */
import { NextResponse } from 'next/server'

export type ApiErrorBody = {
  error: { message: string; code: string }
}

type ErrorFn = {
  (message: string, status?: number, code?: string, extra?: Record<string, unknown>): NextResponse
  /** Build a safe error from an unknown exception — logs detail, returns generic text. */
  from: (err: unknown, status?: number, code?: string) => NextResponse
}

const baseError = (
  message: string,
  status = 400,
  code = 'bad_request',
  extra?: Record<string, unknown>,
): NextResponse => {
  return NextResponse.json<ApiErrorBody & Record<string, unknown>>(
    { error: { message, code }, ...(extra ?? {}) },
    { status },
  )
}

export const apiError = baseError as ErrorFn

apiError.from = (err: unknown, status = 500, code = 'internal_error') => {
  // Never surface raw exception text to clients; log it server-side instead.
  console.error('[api]', code, err)
  const message =
    status >= 500 ? 'Something went wrong. Please try again.' : err instanceof Error ? err.message : 'Request failed'
  return baseError(message, status, code)
}

export function apiOk<T>(data: T, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(data, { status, ...(headers ? { headers } : {}) })
}

/** Common shorthands */
export const unauthorized = (message = 'Sign in to continue') => apiError(message, 401, 'unauthorized')
export const forbidden = (message = 'You do not have access to this resource') =>
  apiError(message, 403, 'forbidden')
export const notFound = (message = 'Not found') => apiError(message, 404, 'not_found')
export const tooManyRequests = (message = 'Too many requests') => apiError(message, 429, 'rate_limited')
export const invalidBody = (message = 'Invalid JSON body') => apiError(message, 400, 'invalid_body')
