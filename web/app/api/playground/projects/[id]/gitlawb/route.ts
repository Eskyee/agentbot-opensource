import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { pushPlaygroundToGitlawb } from '@/app/lib/playground-gitlawb'
import { normalizeGeneration, serializeProject } from '../../_shared'

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
      return NextResponse.json({ error: 'Generate files before pushing this project to GitLawb.' }, { status: 400 })
    }

    const gitlawb = await pushPlaygroundToGitlawb({
      projectId: project.id,
      projectName: project.name,
      generation,
    })

    const updated = await prisma.playgroundProject.update({
      where: { id: project.id },
      data: {
        status: 'PUBLISHED',
        publishedUrl: gitlawb.webUrl,
        deploymentProvider: 'gitlawb',
        deploymentId: gitlawb.commitSha,
        deploymentState: gitlawb.state,
        lastActiveAt: new Date(),
      },
    })

    return NextResponse.json({
      project: serializeProject(updated),
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
