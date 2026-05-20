import { execFile } from 'child_process'
import { createHash, createPrivateKey, createPublicKey, sign } from 'crypto'
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import bs58 from 'bs58'
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

type GitlawbIdentity = {
  did: string
  pem: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 54) || 'untitled'
}

function normalizePem(value: string) {
  return value.includes('\\n') ? value.replace(/\\n/g, '\n') : value
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

async function loadGitlawbIdentity(): Promise<GitlawbIdentity> {
  const inlinePem = process.env.GITLAWB_IDENTITY_PEM || process.env.GITLAWB_PRIVATE_KEY
  const filePath = process.env.GITLAWB_IDENTITY_FILE || process.env.GITLAWB_KEY
  const identityDir = process.env.GITLAWB_IDENTITY_DIR

  let pem = inlinePem ? normalizePem(inlinePem) : ''
  if (!pem && filePath) {
    pem = await readFile(filePath.replace(/^~(?=$|\/)/, os.homedir()), 'utf8')
  }
  if (!pem && identityDir) {
    pem = await readFile(path.join(identityDir.replace(/^~(?=$|\/)/, os.homedir()), 'identity.pem'), 'utf8')
  }
  if (!pem) {
    const defaultPath = path.join(os.homedir(), '.gitlawb/identity.pem')
    pem = await readFile(defaultPath, 'utf8').catch(() => '')
  }

  if (!pem.trim()) {
    throw new Error('GitLawb identity is not configured. Set GITLAWB_IDENTITY_PEM, GITLAWB_IDENTITY_FILE, or GITLAWB_IDENTITY_DIR.')
  }

  const configuredDid = process.env.GITLAWB_DID?.trim()
  const did = configuredDid?.startsWith('did:key:z') ? configuredDid : deriveDidFromPem(pem)
  return { did, pem }
}

function deriveDidFromPem(pem: string) {
  const publicKey = createPublicKey(createPrivateKey(pem))
  const spki = publicKey.export({ type: 'spki', format: 'der' })
  const ed25519PublicKey = Buffer.from(spki).subarray(-32)
  const encoded = `z${bs58.encode(Buffer.concat([Buffer.from([0xed, 0x01]), ed25519PublicKey]))}`
  return `did:key:${encoded}`
}

function contentDigest(body: Buffer) {
  return `sha-256=:${createHash('sha256').update(body).digest('base64')}:`
}

function signGitlawbRequest(identity: GitlawbIdentity, method: string, pathAndQuery: string, body: Buffer) {
  const created = Math.floor(Date.now() / 1000)
  const digest = contentDigest(body)
  const signatureInput = `sig1=("@method" "@path" "content-digest");keyid="${identity.did}";alg="ed25519";created=${created}`
  const signatureParams = signatureInput.slice('sig1='.length)
  const signingString = [
    `"@method": ${method.toUpperCase()}`,
    `"@path": ${pathAndQuery}`,
    `"content-digest": ${digest}`,
    `"@signature-params": ${signatureParams}`,
  ].join('\n')
  const signature = sign(null, Buffer.from(signingString), createPrivateKey(identity.pem)).toString('base64')

  return {
    'Content-Digest': digest,
    'Signature-Input': signatureInput,
    Signature: `sig1=:${signature}:`,
  }
}

async function createGitlawbRepo(node: string, identity: GitlawbIdentity, repo: string, description: string) {
  const body = Buffer.from(JSON.stringify({
    name: repo,
    description,
    is_public: true,
    default_branch: 'main',
  }))
  const requestPath = '/api/v1/repos'
  const response = await fetch(`${node}${requestPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...signGitlawbRequest(identity, 'POST', requestPath, body),
    },
    body,
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok && response.status !== 409) {
    const text = await response.text().catch(() => '')
    throw new Error(`GitLawb node repo create failed with ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
  }

  return response.ok ? response.json().catch(() => ({})) : {}
}

async function writeGitlawbRemoteHelper(binDir: string) {
  const helperPath = path.join(binDir, 'git-remote-gitlawb')
  await writeFile(helperPath, `#!/usr/bin/env node
const { createHash, createPrivateKey, sign } = require('crypto')
const http = require('http')
const https = require('https')
const readline = require('readline')

function parseUrl(url) {
  const rest = url.replace(/^gitlawb:\\/\\//, '')
  const slash = rest.lastIndexOf('/')
  if (slash < 0) throw new Error('Invalid gitlawb URL')
  const did = rest.slice(0, slash)
  const repo = rest.slice(slash + 1).replace(/\\.git$/, '')
  const owner = did.split(':').pop()
  return { did, owner, repo }
}

function request(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const client = target.protocol === 'https:' ? https : http
    const req = client.request(target, { method, headers }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks) }))
    })
    req.on('error', reject)
    if (body?.length) req.write(body)
    req.end()
  })
}

function digest(body) {
  return 'sha-256=:' + createHash('sha256').update(body).digest('base64') + ':'
}

function signedHeaders(method, pathAndQuery, body) {
  const did = process.env.GITLAWB_DID
  const pem = (process.env.GITLAWB_IDENTITY_PEM || '').replace(/\\\\n/g, '\\n')
  if (!did || !pem) return {}
  const created = Math.floor(Date.now() / 1000)
  const contentDigest = digest(body)
  const signatureInput = 'sig1=("@method" "@path" "content-digest");keyid="' + did + '";alg="ed25519";created=' + created
  const signatureParams = signatureInput.slice('sig1='.length)
  const signingString = [
    '"@method": ' + method.toUpperCase(),
    '"@path": ' + pathAndQuery,
    '"content-digest": ' + contentDigest,
    '"@signature-params": ' + signatureParams,
  ].join('\\n')
  const signature = sign(null, Buffer.from(signingString), createPrivateKey(pem)).toString('base64')
  return {
    'Content-Digest': contentDigest,
    'Signature-Input': signatureInput,
    Signature: 'sig1=:' + signature + ':',
  }
}

function stripAnnouncement(buffer) {
  if (buffer.length < 8) return buffer
  const len = Number.parseInt(buffer.subarray(0, 4).toString('ascii'), 16)
  if (!Number.isFinite(len) || len <= 4 || len > buffer.length) return buffer
  const line = buffer.subarray(4, len).toString('utf8')
  if (!line.startsWith('# service=')) return buffer
  const flushEnd = buffer.subarray(len, len + 4).toString('ascii') === '0000' ? len + 4 : len
  return buffer.subarray(flushEnd)
}

function readAll(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
    stream.resume()
  })
}

async function handleConnect(repoBase, service) {
  const refsUrl = repoBase + '/info/refs?service=' + encodeURIComponent(service)
  const refs = await request('GET', refsUrl, { 'User-Agent': 'git/2.0 agentbot-gitlawb-http/1.0' })
  if (refs.status < 200 || refs.status >= 300) throw new Error('GitLawb info/refs failed with ' + refs.status)
  process.stdout.write(stripAnnouncement(refs.body))

  const body = await readAll(process.stdin)
  if (!body.length) return

  const postUrl = repoBase + '/' + service
  const postPath = new URL(postUrl).pathname
  const headers = {
    'Content-Type': 'application/x-' + service + '-request',
    'User-Agent': 'git/2.0 agentbot-gitlawb-http/1.0',
    ...(service === 'git-receive-pack' ? signedHeaders('POST', postPath, body) : {}),
  }
  const pushed = await request('POST', postUrl, headers, body)
  if (pushed.status < 200 || pushed.status >= 300) throw new Error('GitLawb ' + service + ' failed with ' + pushed.status + ': ' + pushed.body.toString('utf8').slice(0, 300))
  process.stdout.write(pushed.body)
}

async function main() {
  const url = process.argv[3]
  const { owner, repo } = parseUrl(url)
  const node = (process.env.GITLAWB_NODE || 'https://node.gitlawb.com').replace(/\\/+$/, '')
  const repoBase = node + '/' + owner + '/' + repo
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
  for await (const line of rl) {
    const cmd = line.trim()
    if (cmd === 'capabilities') {
      process.stdout.write('connect\\n\\n')
    } else if (cmd.startsWith('connect ')) {
      const service = cmd.slice('connect '.length).trim()
      process.stdout.write('\\n')
      rl.close()
      await handleConnect(repoBase, service)
      return
    } else if (!cmd) {
      return
    }
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error)
  process.exit(1)
})
`, 'utf8')
  await chmod(helperPath, 0o755)
  return helperPath
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
  const repo = `${slugify(args.projectName)}-${args.projectId.slice(0, 8)}`
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'agentbot-playground-gitlawb-'))
  const logs: string[] = []

  try {
    const identity = await loadGitlawbIdentity()
    await createGitlawbRepo(node, identity, repo, `Agentbot Playground project ${args.projectName}`)
    logs.push(`created repo ${repo} through ${node}/api/v1/repos`)

    await writeProjectFiles(tmpRoot, args.generation)
    await run('git', ['init', '-b', 'main'], tmpRoot)
    await run('git', ['config', 'user.name', 'Agentbot Playground'], tmpRoot)
    await run('git', ['config', 'user.email', 'playground@agentbot.local'], tmpRoot)
    await run('git', ['add', '.'], tmpRoot)
    await run('git', ['commit', '-m', `Publish ${args.projectName} from Agentbot Playground`], tmpRoot)

    const binDir = path.join(tmpRoot, '.agentbot-bin')
    await mkdir(binDir, { recursive: true })
    await writeGitlawbRemoteHelper(binDir)
    const remoteUrl = `gitlawb://${identity.did}/${repo}`
    const gitlawbEnv: Record<string, string> = {
      GITLAWB_NODE: node,
      GITLAWB_DID: identity.did,
      GITLAWB_IDENTITY_PEM: identity.pem,
      PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    }

    await run('git', ['remote', 'add', 'gitlawb', remoteUrl], tmpRoot)
    const pushed = await run('git', ['push', 'gitlawb', 'main'], tmpRoot, gitlawbEnv)
    logs.push(pushed.stdout.trim(), pushed.stderr.trim())

    const commit = await run('git', ['rev-parse', 'HEAD'], tmpRoot)

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
