/**
 * @jest-environment node
 */
jest.mock('@/app/lib/prisma', () => ({ prisma: {} }))
jest.mock('@/app/lib/token-encryption', () => ({
  encryptToken: (v: string) => v,
  decryptToken: (v: string) => v,
}))

import { buildOAuthStartUrl } from '@/app/lib/mcp-integrations'

describe('buildOAuthStartUrl', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      NOTION_CLIENT_ID: 'notion-client',
      MCP_NOTION_CALLBACK_URL: 'https://app.example.com/api/mcp-integrations/notion/callback',
    }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  test('notion authorize URL includes the required owner=user parameter', () => {
    const url = new URL(buildOAuthStartUrl('notion', 'state-123'))

    expect(url.origin + url.pathname).toBe('https://api.notion.com/v1/oauth/authorize')
    expect(url.searchParams.get('owner')).toBe('user')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('notion-client')
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://app.example.com/api/mcp-integrations/notion/callback',
    )
    expect(url.searchParams.get('state')).toBe('state-123')
  })

  test('returns empty string when notion server env is not configured', () => {
    delete process.env.NOTION_CLIENT_ID
    expect(buildOAuthStartUrl('notion', 'state-123')).toBe('')
  })
})
