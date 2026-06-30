/**
 * POST /api/playground/sandbox — create a real CodeSandbox from playground files.
 * Requires active subscription. Returns sandbox URL for full IDE experience.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 30;

type SandboxFile = { path: string; content: string };

function jsonResponse(error: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error, ...details }, { status });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return jsonResponse('Sign in to open a full sandbox.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true, trialEndsAt: true },
  });
  const trialActive = !!(user?.trialEndsAt && user.trialEndsAt > new Date());
  if (user?.subscriptionStatus !== 'active' && !trialActive) {
    return jsonResponse('Active subscription required for full sandbox.', 403);
  }

  const apiKey = process.env.CSB_API_KEY;
  if (!apiKey) {
    return jsonResponse('CodeSandbox is not configured. Contact support.', 503);
  }

  let body: { files?: SandboxFile[]; title?: string } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse('Invalid JSON body', 400);
  }

  const files = Array.isArray(body.files) ? body.files : [];
  if (files.length === 0) {
    return jsonResponse('No files to create sandbox from.', 400);
  }

  try {
    const { CodeSandbox } = await import('@codesandbox/sdk');
    const sdk = new CodeSandbox(apiKey);

    const sandbox = await sdk.sandboxes.create();
    const client = await sandbox.connect();

    // Batch write all files (more efficient than individual writes)
    await (client.fs as any).batchWrite(
      files.map((file) => ({
        path: file.path.startsWith('/') ? file.path : `/${file.path}`,
        content: file.content,
      }))
    );

    // Install dependencies if package.json exists
    const pkgFile = files.find((f) => f.path === 'package.json');
    if (pkgFile) {
      try {
        await client.commands.run('npm install');
      } catch {
        // Best effort — sandbox still works for static preview
      }
    }

    const sandboxUrl = `https://${sandbox.id}.csb.app/`;
    const editorUrl = `https://codesandbox.io/s/${sandbox.id}`;

    return NextResponse.json({
      sandboxId: sandbox.id,
      sandboxUrl,
      editorUrl,
    });
  } catch (error) {
    console.error('[playground.sandbox] failed', error);
    return jsonResponse(error instanceof Error ? error.message : 'Failed to create sandbox', 502);
  }
}
