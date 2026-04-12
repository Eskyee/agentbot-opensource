import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/lib/getAuthSession";
import { appendManagedAgentEvent } from "@/app/lib/managedAgentEvents";
import { prisma } from "@/app/lib/prisma";
import { xSocialMessageHook } from "@/app/workflows/x-social-session";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, text, tone = "direct" } = await request.json();
    if (!sessionId || !text?.trim()) {
      return NextResponse.json({ error: "sessionId and text are required" }, { status: 400 });
    }

    const row = await prisma.managedAgentSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.managedAgentSession.update({
      where: { id: row.id },
      data: { updatedAt: new Date() },
    });

    await appendManagedAgentEvent({
      sessionId,
      type: 'session.resumed',
      payload: {
        text: text.trim(),
        tone: String(tone),
      },
    }).catch((error) => {
      console.error('Managed agent session.resumed append failed:', error)
    })

    await xSocialMessageHook.resume(`x-social:${sessionId}`, {
      text: text.trim(),
      tone: String(tone),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Managed agent message error:", error);
    return NextResponse.json({ error: "Failed to resume managed session" }, { status: 500 });
  }
}
