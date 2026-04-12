"use workflow"

import { defineHook, getWritable } from "workflow";
import { generateXDraft } from "@/app/lib/xDraftGenerator";
import { appendXDraft } from "@/app/lib/xDrafts";
import { prisma } from "@/app/lib/prisma";

export type ManagedAgentEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export const xSocialMessageHook = defineHook<{ text: string; tone?: string }>();

function makeEvent(eventId: string, type: string, payload: Record<string, unknown>): ManagedAgentEvent {
  return {
    id: eventId,
    type,
    payload,
    occurredAt: new Date().toISOString(),
  };
}

async function persistEventStep(input: {
  sessionId: string;
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}) {
  "use step";
  await prisma.managedAgentEvent.upsert({
    where: { eventId: input.eventId },
    update: {
      type: input.type,
      payload: input.payload,
      occurredAt: new Date(input.occurredAt),
    },
    create: {
      sessionId: input.sessionId,
      eventId: input.eventId,
      type: input.type,
      payload: input.payload,
      occurredAt: new Date(input.occurredAt),
    },
  });
}

async function emit(
  writer: WritableStreamDefaultWriter<ManagedAgentEvent>,
  sessionId: string,
  eventId: string,
  type: string,
  payload: Record<string, unknown>
) {
  const event = makeEvent(eventId, type, payload);
  await persistEventStep({
    sessionId,
    eventId,
    type,
    payload,
    occurredAt: event.occurredAt,
  });
  await writer.write(event);
}

async function generateDraftStep(input: { text: string; tone: string }) {
  "use step";
  return generateXDraft(input.text, input.tone);
}

async function saveDraftStep(input: { userId: string; text: string; draft: string; tone: string }) {
  "use step";
  return appendXDraft(input.userId, {
    sourceText: input.text,
    draftText: input.draft,
    tone: input.tone,
  });
}

async function processTurn(sessionId: string, userId: string, turnIndex: number, text: string, tone: string) {
  const writer = getWritable<ManagedAgentEvent>().getWriter();
  try {
    await emit(writer, sessionId, `${sessionId}:turn-${turnIndex}:user-message`, "user.message", { text, tone });
    await emit(writer, sessionId, `${sessionId}:turn-${turnIndex}:signal-detected`, "signal.detected", { text });

    const draft = await generateDraftStep({ text, tone });
    const savedDraft = await saveDraftStep({ userId, text, draft, tone });

    await emit(writer, sessionId, `${sessionId}:turn-${turnIndex}:draft-generated`, "draft.generated", { draft, tone, draftId: savedDraft.id });
    await emit(writer, sessionId, `${sessionId}:turn-${turnIndex}:approval-required`, "approval.required", { draft, tone, draftId: savedDraft.id });
  } finally {
    writer.releaseLock();
  }
}

export async function xSocialSessionWorkflow(input: {
  userId: string;
  vaultId: string;
  internalSessionId: string;
  initialMessage: string;
  initialTone: string;
}) {
  let turnIndex = 0;
  await processTurn(input.internalSessionId, input.userId, turnIndex, input.initialMessage, input.initialTone);

  const hook = xSocialMessageHook.create({
    token: `x-social:${input.internalSessionId}`,
  });

  for await (const { text, tone } of hook) {
    turnIndex += 1;
    await processTurn(input.internalSessionId, input.userId, turnIndex, text, tone || "direct");
  }
}
