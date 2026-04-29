import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'agentbot-skill'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to download skills' }, { status: 401 })
  }

  const { skillId } = await params
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      author: true,
      code: true,
      mcpConfig: true,
      mcpEnabled: true,
      widgetUrl: true,
      widgetConfig: true,
    },
  })

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
  }

  if (!skill.code?.trim() && !skill.mcpEnabled && !skill.widgetUrl && !skill.widgetConfig) {
    return NextResponse.json(
      { error: 'This skill does not have a downloadable package yet. Use Install to sync it to your runtime.' },
      { status: 404 }
    )
  }

  await prisma.skill.update({
    where: { id: skill.id },
    data: { downloads: { increment: 1 } },
  }).catch(() => null)

  const manifest = {
    schema: 'agentbot.skill.v1',
    exportedAt: new Date().toISOString(),
    skill: {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      author: skill.author,
      code: skill.code,
      mcpEnabled: skill.mcpEnabled,
      mcpConfig: skill.mcpConfig,
      widgetUrl: skill.widgetUrl,
      widgetConfig: skill.widgetConfig,
    },
  }

  const filename = `${slugify(skill.name)}.agentbot-skill.json`
  return new NextResponse(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
