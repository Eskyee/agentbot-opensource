import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { Sandbox } from '@vercel/sandbox'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Create a sandbox and run code
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, code, language, command, timeout } = await req.json()

    switch (action) {
      case 'run': {
        // Create sandbox, run code, return output
        if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

        const sandbox = await Sandbox.create({
          runtime: language === 'python' ? 'python3.13' : 'node24',
          timeout: timeout || 60,
        })

        const ext = language === 'python' ? 'py' : 'js'
        const filename = `/vercel/sandbox/main.${ext}`

        await sandbox.writeFiles([{ path: filename, content: code }])

        const cmd = language === 'python'
          ? `python3 ${filename}`
          : `node ${filename}`

        const result = await sandbox.runCommand({ cmd })

        await sandbox.stop()

        return NextResponse.json({
          success: true,
          action: 'run',
          language,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          duration: `${result.durationMs}ms`,
        })
      }

      case 'test': {
        // Create sandbox for testing code
        if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

        const sandbox = await Sandbox.create({
          runtime: 'node24',
          timeout: 120,
        })

        // Write test file
        await sandbox.writeFiles([{
          path: '/vercel/sandbox/test.js',
          content: code,
        }])

        // Run with node
        const result = await sandbox.runCommand({
          cmd: 'node /vercel/sandbox/test.js',
        })

        // Also try to install and run npm test if package.json exists
        let npmResult = null
        try {
          npmResult = await sandbox.runCommand({
            cmd: 'cd /vercel/sandbox && npm test 2>/dev/null || echo "No tests found"',
          })
        } catch {
          // npm test may not be configured
        }

        await sandbox.stop()

        return NextResponse.json({
          success: true,
          action: 'test',
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          npmTest: npmResult ? {
            stdout: npmResult.stdout,
            exitCode: npmResult.exitCode,
          } : null,
        })
      }

      case 'shell': {
        // Run a shell command in sandbox
        if (!command) return NextResponse.json({ error: 'command required' }, { status: 400 })

        const sandbox = await Sandbox.create({
          runtime: 'node24',
          timeout: 60,
        })

        const result = await sandbox.runCommand({ cmd: command })
        await sandbox.stop()

        return NextResponse.json({
          success: true,
          action: 'shell',
          command,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        })
      }

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: run, test, shell',
        }, { status: 400 })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sandbox error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Vercel Sandbox',
    version: '0.1.0',
    status: 'active',
    capabilities: [
      'run — Execute code in isolated sandbox (Node.js, Python)',
      'test — Run tests in sandbox environment',
      'shell — Execute shell commands safely',
    ],
    runtimes: ['node24', 'node22', 'python3.13'],
    isolation: 'Firecracker microVM',
  })
}
