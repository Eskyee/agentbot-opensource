import { NextRequest } from "next/server";
import { getRun } from "workflow/api";
import { getAuthSession } from "@/app/lib/getAuthSession";
import { prisma } from "@/app/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;

  const row = await prisma.managedAgentSession.findFirst({
    where: {
      workflowRunId: runId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const run = getRun(runId);
  const readable = run.getReadable();
  const encoder = new TextEncoder();

  const sseStream = new ReadableStream({
    async start(controller) {
      const reader = (readable as unknown as ReadableStream).getReader();
      try {
        while (!request.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(value)}\n\n`),
          );
        }
        controller.close();
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
