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
} from './_shared'

export const runtime = 'nodejs'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()

  try {
    const projects = await prisma.playgroundProject.findMany({
      where: {
        userId: session.user.id,
        status: { not: 'ARCHIVED' },
      },
      orderBy: { lastActiveAt: 'desc' },
    })

    return NextResponse.json({
      projects: projects.map(serializeProject),
      storage: 'server',
    })
  } catch (error) {
    if (isMissingPlaygroundProjectTable(error)) {
      return NextResponse.json({ projects: [], storage: 'local' })
    }

    console.error('[playground.projects] list failed', error)
    return NextResponse.json({ error: 'Failed to load playground projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()

  try {
    const body = await req.json()
    const generation = normalizeGeneration(body?.generation)
    const id = asString(body?.id).trim()

    const project = await prisma.playgroundProject.create({
      data: {
        ...(id ? { id } : {}),
        userId: session.user.id,
        name: asString(body?.name, 'untitled').trim().slice(0, 64) || 'untitled',
        status: normalizeStatus(body?.status),
        template: asString(body?.template, 'VITE-REACT-TS').trim().slice(0, 40) || 'VITE-REACT-TS',
        prompt: asString(body?.prompt).slice(0, 5000) || null,
        provider: asString(body?.provider).slice(0, 80) || null,
        model: asString(body?.model).slice(0, 120) || null,
        publishedUrl: asString(body?.publishedUrl).slice(0, 240) || null,
        deploymentProvider: asString(body?.deploymentProvider).slice(0, 80) || null,
        deploymentId: asString(body?.deploymentId).slice(0, 160) || null,
        deploymentState: asString(body?.deploymentState).slice(0, 80) || null,
        generation: generation ? generationToJson(generation) : undefined,
        lastActiveAt: new Date(),
        archivedAt: normalizeStatus(body?.status) === 'ARCHIVED' ? new Date() : null,
      },
    })

    return NextResponse.json({ project: serializeProject(project), storage: 'server' }, { status: 201 })
  } catch (error) {
    if (isMissingPlaygroundProjectTable(error)) {
      return NextResponse.json(
        { error: 'Playground database storage is not ready. Your project is still saved locally in this browser.' },
        { status: 503 },
      )
    }

    console.error('[playground.projects] create failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create playground project' },
      { status: 500 },
    )
  }
}
