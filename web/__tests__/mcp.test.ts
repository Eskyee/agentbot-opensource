jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    skill: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/mcp', () => {
  const actual = jest.requireActual('@/app/lib/mcp')

  return {
    ...actual,
    mcpManager: {
      activate: jest.fn(),
      deactivate: jest.fn(),
      callTool: jest.fn(),
      stop: jest.fn(),
    },
  }
})

import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { McpManager, mcpManager } from '@/app/lib/mcp'
import { POST as callToolRoute } from '@/app/api/mcp/[skillId]/call/[toolName]/route'

describe('McpManager', () => {
  const findUnique = prisma.skill.findUnique as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('rejects skills disabled by persisted mcpEnabled flag', async () => {
    findUnique.mockResolvedValue({
      id: 'skill-1',
      name: 'Demo Skill',
      mcpEnabled: false,
      mcpConfig: {
        enabled: true,
        name: 'demo-skill',
        tools: [],
      },
    })

    const manager = new McpManager()

    await expect(manager.activate('skill-1')).rejects.toThrow('MCP is disabled for skill skill-1')

    manager.stop()
  })

  test('normalizes valid configs that omit handler and version', async () => {
    findUnique.mockResolvedValue({
      id: 'skill-2',
      name: 'Search Skill',
      mcpEnabled: true,
      mcpConfig: {
        name: 'search-skill',
        tools: [
          {
            name: 'search',
            description: 'Search the web',
            parameters: {
              query: { type: 'string', required: true },
            },
          },
        ],
      },
    })

    const manager = new McpManager()
    const activeMcp = await manager.activate('skill-2')

    expect(activeMcp.config.version).toBe('1.0.0')
    expect(activeMcp.config.tools[0]).toMatchObject({
      name: 'search',
      description: 'Search the web',
      handler: undefined,
    })

    manager.stop()
  })

  test('rejects malformed tool definitions', async () => {
    findUnique.mockResolvedValue({
      id: 'skill-3',
      name: 'Broken Skill',
      mcpEnabled: true,
      mcpConfig: {
        enabled: true,
        name: 'broken-skill',
        tools: [
          {
            description: 'Missing a name',
            parameters: {},
          },
        ],
      },
    })

    const manager = new McpManager()

    await expect(manager.activate('skill-3')).rejects.toThrow(
      'Skill skill-3 has invalid MCP tool name at index 0'
    )

    manager.stop()
  })
})

describe('MCP call route', () => {
  const mockedSession = getAuthSession as jest.Mock
  const mockedCallTool = (mcpManager as { callTool: jest.Mock }).callTool

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when the user is not authenticated', async () => {
    mockedSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/mcp/skill-1/call/search', {
      method: 'POST',
      body: JSON.stringify({ parameters: { query: 'london' } }),
    })

    const response = await callToolRoute(req, {
      params: Promise.resolve({ skillId: 'skill-1', toolName: 'search' }),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  test('forwards wrapped parameters to the MCP manager', async () => {
    mockedSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockedCallTool.mockResolvedValue({
      success: true,
      data: { hits: 3 },
      latencyMs: 12,
    })

    const req = new NextRequest('http://localhost/api/mcp/skill-1/call/search', {
      method: 'POST',
      body: JSON.stringify({ parameters: { query: 'london' } }),
    })

    const response = await callToolRoute(req, {
      params: Promise.resolve({ skillId: 'skill-1', toolName: 'search' }),
    })

    expect(mockedCallTool).toHaveBeenCalledWith('skill-1', 'search', { query: 'london' })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      skillId: 'skill-1',
      toolName: 'search',
      data: { hits: 3 },
      latencyMs: 12,
    })
  })

  test('accepts direct JSON objects as parameters', async () => {
    mockedSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockedCallTool.mockResolvedValue({
      success: true,
      data: { hits: 1 },
      latencyMs: 5,
    })

    const req = new NextRequest('http://localhost/api/mcp/skill-1/call/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'berlin' }),
    })

    await callToolRoute(req, {
      params: Promise.resolve({ skillId: 'skill-1', toolName: 'search' }),
    })

    expect(mockedCallTool).toHaveBeenCalledWith('skill-1', 'search', { query: 'berlin' })
  })
})
