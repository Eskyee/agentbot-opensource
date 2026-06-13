import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { normalizeGeneration, isMissingPlaygroundProjectTable } from '@/app/api/playground/projects/_shared'
import { SharedAppView } from './SharedAppView'

export const runtime = 'nodejs'

async function loadShared(id: string) {
  const project = await prisma.playgroundProject
    .findUnique({
      where: { id },
      select: { id: true, name: true, generation: true, publishedUrl: true },
    })
    .catch((error) => {
      if (isMissingPlaygroundProjectTable(error)) return null
      throw error
    })
  if (!project) return null
  const generation = normalizeGeneration(project.generation)
  if (!generation) return null
  return { project, generation }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await loadShared(id.trim()).catch(() => null)
  if (!data) return { title: 'App not found — Agentbot Playground' }
  const title = `${data.generation.title} — built with Agentbot`
  const description = data.generation.summary || 'Built on the Agentbot Playground. Remix it free.'
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', url: `https://agentbot.sh/playground/s/${id}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SharedPlaygroundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadShared(id.trim()).catch(() => null)
  if (!data) notFound()

  return (
    <SharedAppView
      id={data.project.id}
      title={data.generation.title}
      summary={data.generation.summary}
      files={data.generation.files}
      publishedUrl={data.project.publishedUrl ?? null}
    />
  )
}
