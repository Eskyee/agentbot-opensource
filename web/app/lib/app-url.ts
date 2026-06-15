export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.sh'

export function buildAppUrl(path = ''): string {
  const normalizedPath = path.startsWith('/') || path === '' ? path : `/${path}`
  return `${APP_URL}${normalizedPath}`
}
