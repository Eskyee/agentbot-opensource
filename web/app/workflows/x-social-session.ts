"use workflow"

import { defineHook, getWritable } from "workflow";
import { generateXDraft } from "@/app/lib/xDraftGenerator";

export type ManagedAgentEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export const xSocialMessageHook = defineHook<{ text: string; tone?: string }>();

function makeEvent(type: string, payload: Record<string, unknown>): ManagedAgentEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    payload,
    occurredAt: new Date().toISOString(),
  };
}

async function emit(writer: WritableStreamDefaultWriter<ManagedAgentEvent>, type: string, payload: Record<string, unknown>) {
  await writer.write(makeEvent(type, payload));
}

async function generateDraftStep(input: { text: string; tone: string }) {
  "use step";
  return generateXDraft(input.text, input.tone);
}

async function processTurn(text: string, tone: string) {
  const writer = getWritable<ManagedAgentEvent>().getWriter();
  try {
    await emit(writer, "user.message", { text, tone });
    await emit(writer, "signal.detected", { text });

    const draft = await generateDraftStep({ text, tone });

    await emit(writer, "draft.generated", { draft, tone });
    await emit(writer, "approval.required", { draft, tone });
  } finally {
    writer.releaseLock();
  }
}

export async function xSocialSessionWorkflow(input: {
  internalSessionId: string;
  initialMessage: string;
  initialTone: string;
}) {
  await processTurn(input.initialMessage, input.initialTone);

  const hook = xSocialMessageHook.create({
    token: `x-social:${input.internalSessionId}`,
  });

  for await (const { text, tone } of hook) {
    await processTurn(text, tone || "direct");
  }
}
