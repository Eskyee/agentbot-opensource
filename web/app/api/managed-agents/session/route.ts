import { randomUUID } from "crypto";
import { start } from "@workflow/core/runtime";
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/lib/getAuthSession";
import { prisma } from "@/app/lib/prisma";
import { buildManagedVaultContextForUser } from "@/app/lib/vault";
import { xSocialSessionWorkflow } from "@/app/workflows/x-social-session";

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.managedAgentSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        workflowRunId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Managed agent session list error:", error);
    return NextResponse.json({ error: "Failed to list managed sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, tone = "direct" } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const id = randomUUID();
    const title = text.length > 60 ? `${text.slice(0, 57)}...` : text;
    const vault = await buildManagedVaultContextForUser(session.user.id)

    const run = await start(xSocialSessionWorkflow, [
      {
        userId: session.user.id,
        vaultId: vault.vaultId,
        internalSessionId: id,
        initialMessage: text.trim(),
        initialTone: String(tone),
      },
    ]);

    await prisma.managedAgentSession.create({
      data: {
        id,
        userId: session.user.id,
        type: "x-social",
        title,
        workflowRunId: run.runId,
        environmentId: vault.vaultId,
      },
    });

    return NextResponse.json({ id, runId: run.runId, vaultId: vault.vaultId, credentialIds: vault.credentialIds });
  } catch (error) {
    console.error("Managed agent session create error:", error);
    return NextResponse.json({ error: "Failed to create managed session" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const row = await prisma.managedAgentSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.managedAgentSession.delete({
      where: { id: row.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Managed agent session delete error:", error);
    return NextResponse.json({ error: "Failed to delete managed session" }, { status: 500 });
  }
}
