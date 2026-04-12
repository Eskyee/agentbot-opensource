import { prisma } from '@/app/lib/prisma'

export async function appendManagedAgentEvent(input: {
  sessionId: string
  type: string
  payload: Record<string, unknown>
}) {
  const occurredAt = new Date()
  const eventId = `${input.sessionId}:${input.type}:${occurredAt.getTime()}`

  await prisma.managedAgentEvent.create({
    data: {
      sessionId: input.sessionId,
      eventId,
      type: input.type,
      payload: input.payload,
      occurredAt,
    },
  })

  await prisma.managedAgentSession.update({
    where: { id: input.sessionId },
    data: { updatedAt: occurredAt },
  })
}
