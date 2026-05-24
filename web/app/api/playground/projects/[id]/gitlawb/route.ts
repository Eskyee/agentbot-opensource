import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { pushPlaygroundToGitlawb } from '@/app/lib/playground-gitlawb'
import { asString, isMissingPlaygroundProjectTable, normalizeGeneration, normalizeStatus, serializeProject } from '../../_shared'

export const runtime = 'nodejs'
export const maxDuration = 120

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function unauthorized() {
  return NextResponse.json({ error: 'Sign in to push playground projects to GitLawb.' }, { status: 401 })
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
      return NextResponse.json({ error: 'Generate files before pushing this project to GitLawb.' }, { status: 400 })
    }

    const gitlawb = await pushPlaygroundToGitlawb({
      projectId,
      projectName: project?.name || requestProject.name,
      generation,
    })

    const updated = project
      ? await prisma.playgroundProject.update({
          where: { id: project.id },
          data: {
            status: 'PUBLISHED',
            publishedUrl: gitlawb.webUrl,
            deploymentProvider: 'gitlawb',
            deploymentId: gitlawb.commitSha,
            deploymentState: gitlawb.state,
            lastActiveAt: new Date(),
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
            publishedUrl: gitlawb.webUrl,
            deploymentProvider: 'gitlawb',
            deploymentId: gitlawb.commitSha,
            deploymentState: gitlawb.state,
          },
      gitlawb,
    })
  } catch (error) {
    console.error('[playground.gitlawb] failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to push playground project to GitLawb' },
      { status: 500 },
    )
  }
}
