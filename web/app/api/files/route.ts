import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Docker from 'dockerode'
import { writeFile, unlink, readdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId') || 'default'

  const containerName = `agentbot-${agentId}`

  try {
    const container = docker.getContainer(containerName)
    const info = await container.inspect()
    
    if (!info.State.Running) {
      return NextResponse.json({ 
        files: [], 
        error: 'Container not running',
        containerRunning: false 
      })
    }

    const exec = await container.exec({
      Cmd: ['ls', '-la', '/home/node/.openclaw/workspace'],
      AttachStdout: true,
      AttachStderr: true
    })

    const stream = await exec.start({ hijack: true, stdin: false })
    
    let output = ''
    await new Promise<void>((resolve) => {
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString()
      })
      stream.on('end', () => resolve())
    })

    const files = output.split('\n').slice(1).filter(line => line.trim()).map(line => {
      const parts = line.split(/\s+/)
      return {
        name: parts[8],
        size: parseInt(parts[4]) || 0,
        modified: parts[5] + ' ' + parts[6]
      }
    }).filter(f => f.name && f.name !== '.' && f.name !== '..')

    return NextResponse.json({ files, containerRunning: true })
  } catch (error: any) {
    return NextResponse.json({ 
      files: [], 
      error: error.message,
      containerRunning: false 
    })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const agentId = formData.get('agentId') as string || 'default'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const containerName = `agentbot-${agentId}`

  try {
    const container = docker.getContainer(containerName)
    const info = await container.inspect()
    
    if (!info.State.Running) {
      return NextResponse.json({ 
        error: 'Container not running. Start the agent first.' 
      }, { status: 400 })
    }

    const tempPath = join(tmpdir(), file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(tempPath, buffer)

    await docker.copyToContainer(containerName, tempPath, '/home/node/.openclaw/workspace')

    await unlink(tempPath)

    return NextResponse.json({ 
      success: true,
      filename: file.name,
      size: file.size,
      message: `Uploaded to ${agentId} agent workspace`
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      hint: 'Make sure the agent container is running'
    }, { status: 500 })
  }
}
