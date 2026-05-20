import { execFile } from 'child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import type { PlaygroundGeneration } from '@/app/api/playground/projects/_shared'

const execFileAsync = promisify(execFile)

type CommandResult = {
  stdout: string
  stderr: string
}

export type GitlawbPlaygroundPush = {
  provider: 'gitlawb'
  node: string
  repo: string
  remoteUrl: string
  webUrl: string
  commitSha: string
  state: 'PUSHED'
  logs: string[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 54) || 'untitled'
}

function getGitlawbCliCandidates() {
  return [
    process.env.GITLAWB_CLI_PATH,
    'gl',
    path.join(os.homedir(), '.local/bin/gl'),
  ].filter(Boolean) as string[]
}

async function run(command: string, args: string[], cwd: string, extraEnv: Record<string, string> = {}): Promise<CommandResult> {
  return execFileAsync(command, args, {
    cwd,
    timeout: 90_000,
    maxBuffer: 1024 * 1024,
    env: {
      ...process.env,
      ...extraEnv,
    },
  }) as Promise<CommandResult>
}

async function runGitlawb(args: string[], cwd: string, extraEnv: Record<string, string>) {
  let lastError: unknown
  for (const candidate of getGitlawbCliCandidates()) {
    try {
      return {
        command: candidate,
        result: await run(candidate, args, cwd, extraEnv),
      }
    } catch (error) {
      lastError = error
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      if (code !== 'ENOENT') throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('GitLawb CLI not found. Install `gl` or set GITLAWB_CLI_PATH.')
}

async function writeProjectFiles(root: string, generation: PlaygroundGeneration) {
  for (const file of generation.files) {
    const target = path.resolve(root, file.path)
    if (!target.startsWith(root + path.sep)) {
      throw new Error(`Unsafe generated path: ${file.path}`)
    }

    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, file.content, 'utf8')
  }
}

function remoteToWebUrl(remoteUrl: string, nodeUrl: string) {
  const match = remoteUrl.match(/^gitlawb:\/\/(?:did:key:)?([^/]+)\/(.+)$/)
  if (!match) return nodeUrl.replace(/\/+$/, '')

  const did = match[1]
  const repo = match[2]
  const nodeHost = new URL(nodeUrl).hostname
  const base = nodeHost === 'node.gitlawb.com' || nodeHost.endsWith('.gitlawb.com')
    ? 'https://gitlawb.com'
    : nodeUrl.replace(/\/+$/, '')

  return `${base}/node/repos/${encodeURIComponent(did.slice(0, 8))}/${encodeURIComponent(repo)}`
}

export async function pushPlaygroundToGitlawb(args: {
  projectId: string
  projectName: string
  generation: PlaygroundGeneration
}): Promise<GitlawbPlaygroundPush> {
  const node = process.env.GITLAWB_NODE || process.env.AGENTBOT_GITLAWB_NODE || 'https://node.gitlawb.com'
  const identityDir = process.env.GITLAWB_IDENTITY_DIR
  const repo = `${slugify(args.projectName)}-${args.projectId.slice(0, 8)}`
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'agentbot-playground-gitlawb-'))
  const logs: string[] = []

  try {
    await writeProjectFiles(tmpRoot, args.generation)
    await run('git', ['init', '-b', 'main'], tmpRoot)
    await run('git', ['config', 'user.name', 'Agentbot Playground'], tmpRoot)
    await run('git', ['config', 'user.email', 'playground@agentbot.local'], tmpRoot)
    await run('git', ['add', '.'], tmpRoot)
    await run('git', ['commit', '-m', `Publish ${args.projectName} from Agentbot Playground`], tmpRoot)

    const gitlawbEnv: Record<string, string> = {
      GITLAWB_NODE: node,
      ...(identityDir ? { GITLAWB_IDENTITY_DIR: identityDir } : {}),
    }
    const initArgs = [
      'init',
      '--name',
      repo,
      '--node',
      node,
      '--description',
      `Agentbot Playground project ${args.projectName}`,
    ]
    if (identityDir) initArgs.push('--dir', identityDir)

    const initialized = await runGitlawb(initArgs, tmpRoot, gitlawbEnv)
    logs.push(initialized.result.stdout.trim(), initialized.result.stderr.trim())

    const pushed = await run('git', ['push', 'gitlawb', 'main'], tmpRoot, gitlawbEnv)
    logs.push(pushed.stdout.trim(), pushed.stderr.trim())

    const remote = await run('git', ['remote', 'get-url', 'gitlawb'], tmpRoot)
    const commit = await run('git', ['rev-parse', 'HEAD'], tmpRoot)
    const remoteUrl = remote.stdout.trim()

    return {
      provider: 'gitlawb',
      node,
      repo,
      remoteUrl,
      webUrl: remoteToWebUrl(remoteUrl, node),
      commitSha: commit.stdout.trim(),
      state: 'PUSHED',
      logs: logs.filter(Boolean).flatMap((line) => line.split('\n')).slice(-20),
    }
  } finally {
    await rm(tmpRoot, { recursive: true, force: true })
  }
}
