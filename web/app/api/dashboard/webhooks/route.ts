import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const webhooks = await prisma.userWebhook.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error('[Webhooks API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, templateId, url, event } = body

    if (!name || !url || !event) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, event' },
        { status: 400 }
      )
    }

    // Generate a webhook secret for signature verification
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`

    const webhook = await prisma.userWebhook.create({
      data: {
        userId: session.user.id,
        name,
        templateId: templateId ?? null,
        url,
        event,
        secret,
        enabled: true,
      },
    })

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'webhook_created',
        category: 'config',
        detail: `Created webhook "${name}" for event "${event}"`,
        metadata: { webhookId: webhook.id, templateId, url },
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    console.error('[Webhooks API] Create error:', error)
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing webhook id' }, { status: 400 })
  }

  try {
    const webhook = await prisma.userWebhook.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await prisma.userWebhook.delete({ where: { id } })

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'webhook_deleted',
        category: 'config',
        detail: `Deleted webhook "${webhook.name}"`,
        metadata: { webhookId: id },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhooks API] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}
