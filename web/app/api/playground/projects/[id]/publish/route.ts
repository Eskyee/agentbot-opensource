import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import {
  deployPlaygroundToVercel,
  getPlaygroundVercelDeployment,
  isVercelPlaygroundConfigured,
} from '@/app/lib/playground-vercel'
import { asString, isMissingPlaygroundProjectTable, normalizeGeneration, normalizeStatus, serializeProject } from '../../_shared'

export const runtime = 'nodejs'
export const maxDuration = 90

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function unauthorized() {
  return NextResponse.json({ error: 'Sign in to publish playground projects.' }, { status: 401 })
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()

  const { id } = await params
  const projectId = id.trim()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const requestGeneration = normalizeGeneration(body?.generation)
  const requestProject = {
    id: projectId,
    name: asString(body?.name, 'untitled').trim().slice(0, 64) || 'untitled',
    status: normalizeStatus(body?.status),
    template: asString(body?.template, 'VITE-REACT-TS').trim().slice(0, 40) || 'VITE-REACT-TS',
    publishedUrl: asString(body?.publishedUrl).slice(0, 240) || undefined,
    deploymentProvider: asString(body?.deploymentProvider).slice(0, 80) || undefined,
    deploymentId: asString(body?.deploymentId).slice(0, 160) || undefined,
    deploymentState: asString(body?.deploymentState).slice(0, 80) || undefined,
    lastActive: 'now',
    generation: requestGeneration,
    provider: asString(body?.provider).slice(0, 80) || undefined,
    model: asString(body?.model).slice(0, 120) || undefined,
    prompt: asString(body?.prompt).slice(0, 5000) || undefined,
  }

  try {
    const project = await prisma.playgroundProject.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    }).catch((error) => {
      if (isMissingPlaygroundProjectTable(error)) return null
      throw error
    })

    if (!project && !requestGeneration) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const generation = project ? normalizeGeneration(project.generation) : requestGeneration
    if (!generation) {
      return NextResponse.json({ error: 'Generate files before publishing this project.' }, { status: 400 })
    }

    if (!isVercelPlaygroundConfigured()) {
      return NextResponse.json(
        { error: 'Vercel publishing is not configured. Add VERCEL_TOKEN and project/team settings before publishing.' },
        { status: 503 },
      )
    }

    const now = new Date()
    const deployment = await deployPlaygroundToVercel({
      projectId,
      projectName: project?.name || requestProject.name,
      generation,
    })
    const updated = project
      ? await prisma.playgroundProject.update({
          where: { id: project.id },
          data: {
            status: 'PUBLISHED',
            publishedUrl: deployment.url,
            deploymentProvider: deployment.provider,
            deploymentId: deployment.id,
            deploymentState: deployment.state,
            lastActiveAt: now,
          },
        }).catch((error) => {
          if (isMissingPlaygroundProjectTable(error)) return null
          throw error
        })
      : null

    return NextResponse.json({
      project: updated
        ? serializeProject(updated)
        : {
            ...requestProject,
            status: 'PUBLISHED',
            publishedUrl: deployment.url,
            deploymentProvider: deployment.provider,
            deploymentId: deployment.id,
            deploymentState: deployment.state,
          },
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
    if (isMissingPlaygroundProjectTable(error)) {
      return NextResponse.json(
        { error: 'Playground database storage is not ready yet. Generate or publish again from the open builder session.' },
        { status: 503 },
      )
    }

    console.error('[playground.publish.status] failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh playground deployment status' },
      { status: 500 },
    )
  }
}
