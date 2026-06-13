/**
 * GET /api/playground/share/:id — public read of a shared playground app.
 *
 * "Anyone with the link" model: the id is an unguessable cuid, and only projects
 * that have a generation are returned (drafts 404). No auth — this powers the
 * public share page and Remix. Returns just what a viewer needs: title, summary,
 * the app files, and the published URL if any.
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { normalizeGeneration, isMissingPlaygroundProjectTable } from '@/app/api/playground/projects/_shared'
import { apiOk, notFound } from '@/app/lib/api/respond'
import { checkRateLimit } from '@/app/lib/api/rate-limit'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await checkRateLimit(req, 'read')) return notFound()

  const { id } = await params
  const projectId = id.trim()
  if (!projectId) return notFound('App not found')

  const project = await prisma.playgroundProject
    .findUnique({
      where: { id: projectId },
      select: { id: true, name: true, generation: true, publishedUrl: true, model: true, updatedAt: true },
    })
    .catch((error) => {
      if (isMissingPlaygroundProjectTable(error)) return null
      throw error
    })

  const generation = project ? normalizeGeneration(project.generation) : null
  if (!project || !generation) return notFound('App not found')

  return apiOk(
    {
      id: project.id,
      name: project.name,
      title: generation.title,
      summary: generation.summary,
      files: generation.files,
      publishedUrl: project.publishedUrl ?? null,
      model: project.model ?? null,
      updatedAt: project.updatedAt,
    },
    200,
    { 'Cache-Control': 'public, max-age=120', 'Access-Control-Allow-Origin': '*' },
  )
}
