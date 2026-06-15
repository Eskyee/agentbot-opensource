require('@testing-library/jest-dom')

// jsdom's test environment doesn't expose Node's web globals that Next.js
// server code (next/server, route handlers) and libraries like viem rely on.
// Polyfill them so API-route and lib tests run under the shared jsdom env.
const { TextEncoder, TextDecoder } = require('util')

if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder

// Request/Response/Headers/fetch from undici (bundled, matches Node 18+ web API)
try {
  const undici = require('undici')
  for (const name of ['Request', 'Response', 'Headers', 'fetch', 'FormData', 'File', 'Blob']) {
    if (typeof global[name] === 'undefined' && undici[name]) {
      global[name] = undici[name]
    }
  }
} catch {
  // undici unavailable — fall back to any Node globals that exist
  for (const name of ['Request', 'Response', 'Headers', 'fetch']) {
    if (typeof global[name] === 'undefined' && typeof globalThis[name] !== 'undefined') {
      global[name] = globalThis[name]
    }
  }
}

// ReadableStream / TransformStream for streaming route handlers
try {
  const streams = require('stream/web')
  for (const name of ['ReadableStream', 'WritableStream', 'TransformStream']) {
    if (typeof global[name] === 'undefined' && streams[name]) {
      global[name] = streams[name]
    }
  }
} catch {
  /* older node — skip */
}
