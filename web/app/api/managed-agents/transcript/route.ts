import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/lib/getAuthSession";
import { prisma } from "@/app/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const row = await prisma.managedAgentSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        type: true,
        workflowRunId: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const events = await prisma.managedAgentEvent.findMany({
      where: { sessionId: row.id },
      orderBy: { occurredAt: 'asc' },
      select: {
        id: true,
        eventId: true,
        type: true,
        payload: true,
        occurredAt: true,
        processedAt: true,
      },
    });

    return NextResponse.json({
      ...row,
      tailing: Boolean(row.workflowRunId),
      events,
    });
  } catch (error) {
    console.error("Managed agent transcript error:", error);
    return NextResponse.json({ error: "Failed to load session metadata" }, { status: 500 });
  }
}
