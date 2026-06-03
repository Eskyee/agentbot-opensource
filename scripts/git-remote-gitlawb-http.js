#!/usr/bin/env node
const { createHash, createPrivateKey, sign } = require('crypto')
const http = require('http')
const https = require('https')
const readline = require('readline')

function parseUrl(url) {
  const rest = url.replace(/^gitlawb:\/\//, '')
  const slash = rest.lastIndexOf('/')
  if (slash < 0) throw new Error('Invalid gitlawb URL')
  const did = rest.slice(0, slash)
  const repo = rest.slice(slash + 1).replace(/\.git$/, '')
  const owner = did.split(':').pop()
  return { owner, repo }
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

function readAll(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
    stream.resume()
  })
}

function contentDigest(body) {
  return `sha-256=:${createHash('sha256').update(body).digest('base64')}:`
}

function signedHeaders(method, pathAndQuery, body) {
  const did = process.env.GITLAWB_DID
  const pem = (process.env.GITLAWB_IDENTITY_PEM || '').replace(/\\n/g, '\n')
  if (!did || !pem) return {}

  const created = Math.floor(Date.now() / 1000)
  const digest = contentDigest(body)
  const signatureInput = `sig1=("@method" "@path" "content-digest");keyid="${did}";alg="ed25519";created=${created}`
  const signatureParams = signatureInput.slice('sig1='.length)
  const signingString = [
    `"@method": ${method.toUpperCase()}`,
    `"@path": ${pathAndQuery}`,
    `"content-digest": ${digest}`,
    `"@signature-params": ${signatureParams}`,
  ].join('\n')
  const signature = sign(null, Buffer.from(signingString), createPrivateKey(pem)).toString('base64')

  return {
    'Content-Digest': digest,
    'Signature-Input': signatureInput,
    Signature: `sig1=:${signature}:`,
  }
}

function stripAnnouncement(buffer) {
  if (buffer.length < 8) return buffer
  const length = Number.parseInt(buffer.subarray(0, 4).toString('ascii'), 16)
  if (!Number.isFinite(length) || length <= 4 || length > buffer.length) return buffer
  const line = buffer.subarray(4, length).toString('utf8')
  if (!line.startsWith('# service=')) return buffer
  const flushEnd = buffer.subarray(length, length + 4).toString('ascii') === '0000' ? length + 4 : length
  return buffer.subarray(flushEnd)
}

async function handleConnect(repoBase, service) {
  const refsUrl = `${repoBase}/info/refs?service=${encodeURIComponent(service)}`
  const refs = await request('GET', refsUrl, { 'User-Agent': 'git/2.0 agentbot-gitlawb-http/1.0' })
  if (refs.status < 200 || refs.status >= 300) throw new Error(`GitLawb info/refs failed with ${refs.status}`)
  process.stdout.write(stripAnnouncement(refs.body))

  const body = await readAll(process.stdin)
  if (!body.length) return

  const postUrl = `${repoBase}/${service}`
  const postPath = new URL(postUrl).pathname
  const headers = {
    'Content-Type': `application/x-${service}-request`,
    'User-Agent': 'git/2.0 agentbot-gitlawb-http/1.0',
    ...(service === 'git-receive-pack' ? signedHeaders('POST', postPath, body) : {}),
  }
  const pushed = await request('POST', postUrl, headers, body)
  if (pushed.status < 200 || pushed.status >= 300) {
    throw new Error(`GitLawb ${service} failed with ${pushed.status}: ${pushed.body.toString('utf8').slice(0, 300)}`)
  }
  process.stdout.write(pushed.body)
}

async function main() {
  const url = process.argv[3]
  const { owner, repo } = parseUrl(url)
  const node = (process.env.GITLAWB_NODE || 'https://node.gitlawb.com').replace(/\/+$/, '')
  const repoBase = `${node}/${owner}/${repo}`
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })

  for await (const line of rl) {
    const cmd = line.trim()
    if (cmd === 'capabilities') {
      process.stdout.write('connect\n\n')
    } else if (cmd.startsWith('connect ')) {
      const service = cmd.slice('connect '.length).trim()
      process.stdout.write('\n')
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
