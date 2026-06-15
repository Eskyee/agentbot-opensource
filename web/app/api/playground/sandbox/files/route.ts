import { NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 120

function getSandboxConfig() {
  const teamId = process.env.VERCEL_TEAM_ID
  const projectId = process.env.VERCEL_PROJECT_ID
  const token = process.env.VERCEL_TOKEN

  if (!teamId || !projectId || !token) {
    throw new Error('Vercel Sandbox credentials not configured.')
  }

  return { teamId, projectId, token }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sandboxName = body.sandboxName as string
    const files = body.files as Array<{ path: string; content: string }>
    const runInstall = body.runInstall !== false

    if (!sandboxName || !Array.isArray(files) || files.length === 0) {
      return Response.json(
        { ok: false, error: 'sandboxName and files[] are required' },
        { status: 400 }
      )
    }

    const config = getSandboxConfig()

    const sandbox = await Sandbox.get({
      name: sandboxName,
      teamId: config.teamId,
      projectId: config.projectId,
      token: config.token,
    })

    const buffers = files.map((f) => ({
      path: f.path,
      content: Buffer.from(f.content, 'utf-8'),
    }))

    await sandbox.writeFiles(buffers)

    const hasPackageJson = files.some((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))

    if (runInstall && hasPackageJson) {
      const install = await sandbox.runCommand({
        cmd: 'npm',
        args: ['install', '--loglevel', 'warn'],
        cwd: '/vercel/sandbox',
      })

      if (install.exitCode !== 0) {
        const stderr = await install.stderr()
        console.warn('[sandbox.files] npm install failed:', stderr)
        return Response.json({
          ok: true,
          warning: 'npm install failed',
          installError: stderr,
        })
      }
    }

    return Response.json({ ok: true, filesWritten: files.length })
  } catch (error) {
    console.error('[sandbox.files] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to write files' },
      { status: 500 }
    )
  }
}
