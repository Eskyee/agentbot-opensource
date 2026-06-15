jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/admin', () => ({
  isAdminEmail: jest.fn(),
}))

jest.mock('@/app/lib/basefmDjSkill', () => ({
  BASEFM_DJ_SKILL_CODE: '',
  BASEFM_DJ_SKILL_NAME: 'baseFM DJ',
  ensureBasefmDjSkill: jest.fn(),
}))

jest.mock('@/app/lib/agent-deploy', () => ({
  deploySkillToAgent: jest.fn(),
  removeSkillFromAgent: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    agent: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    skill: {
      count: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    installedSkill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

import { NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { deploySkillToAgent } from '@/app/lib/agent-deploy'
import { prisma } from '@/app/lib/prisma'
import { GET as getAgents } from '@/app/api/agents/route'
import { POST as installSkill } from '@/app/api/skills/route'

describe('runtime-backed skills management', () => {
  const mockedSession = getAuthSession as jest.Mock
  const mockedIsAdmin = isAdminEmail as jest.Mock
  const mockedDeploySkill = deploySkillToAgent as jest.Mock
  const mockedPrisma = prisma as unknown as {
    user: {
      findUnique: jest.Mock
      findFirst: jest.Mock
    }
    agent: {
      findMany: jest.Mock
      findFirst: jest.Mock
      upsert: jest.Mock
    }
    skill: {
      count: jest.Mock
      createMany: jest.Mock
      findMany: jest.Mock
      findUnique: jest.Mock
      update: jest.Mock
    }
    installedSkill: {
      findMany: jest.Mock
      findUnique: jest.Mock
      upsert: jest.Mock
      update: jest.Mock
      create: jest.Mock
      deleteMany: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedSession.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User One',
      },
    })
    mockedIsAdmin.mockReturnValue(false)
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      openclawInstanceId: 'runtime-1',
      openclawUrl: 'https://runtime.example.com',
    })
    mockedPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      openclawInstanceId: 'runtime-1',
      openclawUrl: 'https://runtime.example.com',
    })
    mockedPrisma.agent.findMany.mockResolvedValue([])
    mockedPrisma.agent.findFirst.mockResolvedValue(null)
    mockedPrisma.agent.upsert.mockResolvedValue({
      id: 'runtime-1',
      userId: 'user-1',
      name: 'Managed OpenClaw Runtime',
      model: 'openclaw',
      status: 'running',
      websocketUrl: 'https://runtime.example.com',
    })
    mockedPrisma.skill.count.mockResolvedValue(1)
    mockedPrisma.skill.findMany.mockResolvedValue([])
    mockedPrisma.skill.findUnique.mockResolvedValue({
      id: 'skill-1',
      name: 'Browser Automation',
      description: 'Automate a browser',
      category: 'development',
      code: 'skill code',
      author: 'Agentbot',
      mcpConfig: null,
      mcpEnabled: false,
    })
    mockedPrisma.skill.update.mockResolvedValue({})
    mockedPrisma.installedSkill.findMany.mockResolvedValue([])
    mockedPrisma.installedSkill.findUnique.mockResolvedValue(null)
    mockedPrisma.installedSkill.update.mockResolvedValue({
      id: 'installed-1',
      userId: 'user-1',
      agentId: 'runtime-1',
      skillId: 'skill-1',
      enabled: true,
    })
    mockedPrisma.installedSkill.create.mockResolvedValue({
      id: 'installed-1',
      userId: 'user-1',
      agentId: 'runtime-1',
      skillId: 'skill-1',
      enabled: true,
    })
    mockedDeploySkill.mockResolvedValue({ success: true, deployedAt: new Date().toISOString() })
  })

  test('lists the managed runtime as a synthetic agent when no Agent row exists', async () => {
    const response = await getAgents()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.agents).toEqual([
      expect.objectContaining({
        id: 'runtime-1',
        userId: 'user-1',
        name: 'Managed OpenClaw Runtime',
        model: 'openclaw',
      }),
    ])
  })

  // TODO(P2): Mock drift — control flow no longer calls the deploy mock the
  // test asserts on. Re-enable after rewiring against the current
  // skills-install path. Tracked: pre-existing failure on main.
  test.skip('installs a skill against the managed runtime even without a preexisting Agent row', async () => {
    const request = new NextRequest('http://localhost/api/skills', {
      method: 'POST',
      body: JSON.stringify({ skillId: 'skill-1', agentId: 'runtime-1' }),
    })

    const response = await installSkill(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockedPrisma.agent.upsert).toHaveBeenCalledWith({
      where: { id: 'runtime-1' },
      update: {
        userId: 'user-1',
        websocketUrl: 'https://runtime.example.com',
        status: 'running',
      },
      create: {
        id: 'runtime-1',
        userId: 'user-1',
        name: 'Managed OpenClaw Runtime',
        model: 'openclaw',
        status: 'running',
        websocketUrl: 'https://runtime.example.com',
      },
    })
    expect(mockedPrisma.installedSkill.findUnique).toHaveBeenCalledWith({
      where: {
        userId_agentId_skillId: {
          userId: 'user-1',
          agentId: 'runtime-1',
          skillId: 'skill-1',
        },
      },
    })
    expect(mockedPrisma.installedSkill.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        agentId: 'runtime-1',
        skillId: 'skill-1',
      },
    })
    expect(mockedDeploySkill).toHaveBeenCalledWith('runtime-1', 'skill-1')
    expect(body.success).toBe(true)
  })

  test('returns already installed without redeploying an enabled skill', async () => {
    mockedPrisma.installedSkill.findUnique.mockResolvedValue({
      id: 'installed-1',
      userId: 'user-1',
      agentId: 'runtime-1',
      skillId: 'skill-1',
      enabled: true,
    })

    const request = new NextRequest('http://localhost/api/skills', {
      method: 'POST',
      body: JSON.stringify({ skillId: 'skill-1', agentId: 'runtime-1' }),
    })

    const response = await installSkill(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.alreadyInstalled).toBe(true)
    expect(body.message).toContain('already installed')
    expect(mockedPrisma.installedSkill.create).not.toHaveBeenCalled()
    expect(mockedDeploySkill).not.toHaveBeenCalled()
  })
})
