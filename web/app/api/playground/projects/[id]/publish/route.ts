import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import {
  deployPlaygroundToVercel,
  getPlaygroundVercelDeployment,
  isVercelPlaygroundConfigured,
} from '@/app/lib/playground-vercel'
import { normalizeGeneration, serializeProject } from '../../_shared'

export const runtime = 'nodejs'
export const maxDuration = 90

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'untitled'
}

export async function POST(_req: Request, { params }: RouteContext) {
  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()

  const { id } = await params
  const projectId = id.trim()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
  }

  try {
    const project = await prisma.playgroundProject.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const generation = normalizeGeneration(project.generation)
    if (!generation) {
      return NextResponse.json({ error: 'Generate files before publishing this project.' }, { status: 400 })
    }

    const now = new Date()
    const deployment = isVercelPlaygroundConfigured()
      ? await deployPlaygroundToVercel({
          projectId: project.id,
          projectName: project.name,
          generation,
        })
      : {
          id: `local-${project.id}`,
          url: `https://${slugify(project.name)}-${Math.random().toString(16).slice(2, 6)}.gitlawb.app/`,
          state: 'LOCAL_PREVIEW',
          provider: 'local-preview' as const,
        }

    const updated = await prisma.playgroundProject.update({
      where: { id: project.id },
      data: {
        status: 'PUBLISHED',
        publishedUrl: deployment.url,
        deploymentProvider: deployment.provider,
        deploymentId: deployment.id,
        deploymentState: deployment.state,
        lastActiveAt: now,
      },
    })

    return NextResponse.json({
      project: serializeProject(updated),
      deployment,
    })
  } catch (error) {
    console.error('[playground.publish] failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish playground project' },
      { status: 500 },
    )
  }
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()

  const { id } = await params
  const projectId = id.trim()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
  }

  try {
    const project = await prisma.playgroundProject.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.deploymentProvider !== 'vercel' || !project.deploymentId) {
      return NextResponse.json({
        project: serializeProject(project),
        deployment: {
          id: project.deploymentId,
          url: project.publishedUrl,
          state: project.deploymentState || 'LOCAL_PREVIEW',
          provider: project.deploymentProvider || 'local-preview',
        },
      })
    }

    const deployment = await getPlaygroundVercelDeployment(project.deploymentId)
    const updated = await prisma.playgroundProject.update({
      where: { id: project.id },
      data: {
        publishedUrl: deployment.url,
        deploymentState: deployment.state,
        lastActiveAt: new Date(),
      },
    })

    return NextResponse.json({
      project: serializeProject(updated),
      deployment,
    })
  } catch (error) {
    console.error('[playground.publish.status] failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh playground deployment status' },
      { status: 500 },
    )
  }
}
