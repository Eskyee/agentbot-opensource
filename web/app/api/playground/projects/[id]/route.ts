import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import {
  asString,
  generationToJson,
  isMissingPlaygroundProjectTable,
  normalizeGeneration,
  normalizeStatus,
  serializeProject,
} from '../_shared'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()

  const { id } = await params
  const projectId = id.trim()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const existing = await prisma.playgroundProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (existing && existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const status = body?.status === undefined ? undefined : normalizeStatus(body.status)
    const generation = body?.generation === undefined ? undefined : normalizeGeneration(body.generation)
    const lastActiveAt = new Date()

    const data = {
      ...(body?.name !== undefined && { name: asString(body.name, 'untitled').trim().slice(0, 64) || 'untitled' }),
      ...(status !== undefined && { status, archivedAt: status === 'ARCHIVED' ? lastActiveAt : null }),
      ...(body?.template !== undefined && { template: asString(body.template, 'VITE-REACT-TS').trim().slice(0, 40) || 'VITE-REACT-TS' }),
      ...(body?.prompt !== undefined && { prompt: asString(body.prompt).slice(0, 5000) || null }),
      ...(body?.provider !== undefined && { provider: asString(body.provider).slice(0, 80) || null }),
      ...(body?.model !== undefined && { model: asString(body.model).slice(0, 120) || null }),
      ...(body?.publishedUrl !== undefined && { publishedUrl: asString(body.publishedUrl).slice(0, 240) || null }),
      ...(body?.deploymentProvider !== undefined && { deploymentProvider: asString(body.deploymentProvider).slice(0, 80) || null }),
      ...(body?.deploymentId !== undefined && { deploymentId: asString(body.deploymentId).slice(0, 160) || null }),
      ...(body?.deploymentState !== undefined && { deploymentState: asString(body.deploymentState).slice(0, 80) || null }),
      ...(generation !== undefined && { generation: generation ? generationToJson(generation) : undefined }),
      lastActiveAt,
    }

    const project = existing
      ? await prisma.playgroundProject.update({
          where: { id: projectId },
          data,
        })
      : await prisma.playgroundProject.create({
          data: {
            id: projectId,
            userId: session.user.id,
            name: asString(body?.name, 'untitled').trim().slice(0, 64) || 'untitled',
            status: status ?? 'IDLE',
            template: asString(body?.template, 'VITE-REACT-TS').trim().slice(0, 40) || 'VITE-REACT-TS',
            prompt: asString(body?.prompt).slice(0, 5000) || null,
            provider: asString(body?.provider).slice(0, 80) || null,
            model: asString(body?.model).slice(0, 120) || null,
            publishedUrl: asString(body?.publishedUrl).slice(0, 240) || null,
            deploymentProvider: asString(body?.deploymentProvider).slice(0, 80) || null,
            deploymentId: asString(body?.deploymentId).slice(0, 160) || null,
            deploymentState: asString(body?.deploymentState).slice(0, 80) || null,
            generation: generation ? generationToJson(generation) : undefined,
            archivedAt: status === 'ARCHIVED' ? lastActiveAt : null,
            lastActiveAt,
          },
        })

    return NextResponse.json({ project: serializeProject(project), storage: 'server' })
  } catch (error) {
    if (isMissingPlaygroundProjectTable(error)) {
      return NextResponse.json({
        project: null,
        storage: 'local',
        warning: 'Playground database storage is not ready. Your project is still saved locally in this browser.',
      })
    }

    console.error('[playground.projects] update failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update playground project' },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()

  const { id } = await params
  const projectId = id.trim()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
  }

  try {
    const existing = await prisma.playgroundProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.playgroundProject.delete({ where: { id: projectId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isMissingPlaygroundProjectTable(error)) {
      return NextResponse.json({ ok: true })
    }
    console.error('[playground.projects] delete failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 },
    )
  }
}
