/**
 * services/gatewayManager.js
 *
 * Manages the lifecycle of the openclaw gateway child process.
 *
 * Design principles:
 *  - Single source of truth for gateway state
 *  - Emits events so any part of the app can react (SSE, WS, logs)
 *  - Auto-restarts on crash with exponential backoff
 *  - Exposes WS proxy attachment for the HTTP server
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import httpProxy from 'http-proxy';
import net from 'net';
import {
  GATEWAY_PORT,
  GATEWAY_HOST,
  GATEWAY_INTERNAL_URL,
  GATEWAY_WS_URL,
  OPENCLAW_GATEWAY_TOKEN,
  OPENCLAW_STATE_DIR,
  DATA_DIR,
} from '../config/index.js';
import { log } from '../utils/log.js';

// How long to wait before checking if gateway TCP port is open
const READY_POLL_INTERVAL_MS = 500;
const READY_TIMEOUT_MS = 60_000;

// Restart backoff: 2s, 4s, 8s, 16s, 30s max
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 30_000;

class GatewayManager extends EventEmitter {
  constructor() {
    super();
    this._proc = null;
    this._state = 'stopped'; // stopped | starting | running | crashed
    this._restartCount = 0;
    this._restartTimer = null;
    this._logs = []; // rolling last 500 lines
    this._httpProxy = httpProxy.createProxyServer({
      target: GATEWAY_INTERNAL_URL,
      changeOrigin: true,
      xfwd: true,
      proxyTimeout: 120_000,
      timeout: 120_000,
    });

    // Inject auth token into every HTTP proxy request so the gateway
    // trusts connections from our wrapper without browser-level auth.
    this._httpProxy.on('proxyReq', (proxyReq) => {
      if (OPENCLAW_GATEWAY_TOKEN) {
        proxyReq.setHeader('Authorization', `Bearer ${OPENCLAW_GATEWAY_TOKEN}`);
      }
    });

    this._httpProxy.on('error', (err, _req, res) => {
      log.error(`Proxy error: ${err.message}`);
      if (res && typeof res.headersSent !== 'undefined' && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Gateway not reachable', detail: err.message }));
      }
    });
  }

  // ─── Public API ────────────────────────────────────────────────

  isRunning() {
    return this._state === 'running';
  }

  getState() {
    return this._state;
  }

  getLogs(lines = 100) {
    return this._logs.slice(-lines);
  }

  async start() {
    if (this._state === 'running' || this._state === 'starting') {
      log.warn('Gateway already running or starting — ignoring start()');
      return;
    }

    this._setState('starting');
    this._restartCount = 0;
    this._spawnProcess();

    // Wait for the gateway TCP port to be accepting connections
    try {
      await this._waitForReady();
      this._setState('running');
      log.info('✅ OpenClaw gateway is ready');
    } catch (err) {
      log.error('Gateway failed to become ready:', err.message);
      this._setState('crashed');
    }
  }

  async stop() {
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }
    if (this._proc) {
      this._proc.kill('SIGTERM');
      this._proc = null;
    }
    this._setState('stopped');
  }

  async restart() {
    log.info('Restarting OpenClaw gateway...');
    await this.stop();
    await new Promise((r) => setTimeout(r, 500));
    await this.start();
  }

  /**
   * Called from server.js's single upgrade handler to forward a WS
   * connection to the openclaw gateway.
   *
   * Uses raw TCP socket piping instead of http-proxy.ws() because
   * http-proxy v1.18.1 has broken WS frame forwarding on Node 22.
   * Also injects Authorization header so the gateway trusts the
   * connection without needing browser-level WS handshake auth.
   */
  handleWsUpgrade(req, socket, head) {
    const url = req.url || '';

    if (!this.isRunning()) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    log.info(`WS proxying: ${url} → ${GATEWAY_WS_URL}${url}`);

    // Raw TCP connection to openclaw gateway — bypasses http-proxy's
    // broken WS piping so frames actually flow in both directions.
    const proxySocket = net.connect(GATEWAY_PORT, GATEWAY_HOST, () => {
      // Reconstruct the HTTP upgrade request, injecting auth + host headers
      let raw = `${req.method} ${url} HTTP/${req.httpVersion}\r\n`;
      let hasAuth = false;

      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const key = req.rawHeaders[i];
        const val = req.rawHeaders[i + 1];
        const lower = key.toLowerCase();

        if (lower === 'host') {
          raw += `${key}: ${GATEWAY_HOST}:${GATEWAY_PORT}\r\n`;
        } else if (lower === 'authorization') {
          // Replace any existing auth with our gateway token
          hasAuth = true;
          if (OPENCLAW_GATEWAY_TOKEN) {
            raw += `${key}: Bearer ${OPENCLAW_GATEWAY_TOKEN}\r\n`;
          } else {
            raw += `${key}: ${val}\r\n`;
          }
        } else {
          raw += `${key}: ${val}\r\n`;
        }
      }

      // Inject Authorization if not already present
      if (!hasAuth && OPENCLAW_GATEWAY_TOKEN) {
        raw += `Authorization: Bearer ${OPENCLAW_GATEWAY_TOKEN}\r\n`;
      }

      raw += '\r\n';

      proxySocket.write(raw);

      // Forward any buffered data (may contain the first WS frame)
      if (head && head.length > 0) {
        proxySocket.write(head);
      }

      // Bidirectional pipe — gateway's 101 response + WS frames
      // flow to the client and vice versa
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxySocket.on('error', (err) => {
      log.warn(`WS proxy error for ${url}: ${err.message}`);
      socket.destroy();
    });

    socket.on('error', () => {
      proxySocket.destroy();
    });

    socket.on('close', () => proxySocket.destroy());
    proxySocket.on('close', () => socket.destroy());
  }

  /**
   * Returns the underlying http-proxy instance for use in the proxy middleware.
   */
  getHttpProxy() {
    return this._httpProxy;
  }

  // ─── Private ───────────────────────────────────────────────────

  _spawnProcess() {
    log.info('Spawning openclaw gateway process...');

    const env = {
      ...process.env,
      HOME: DATA_DIR,                      // openclaw writes ~/.openclaw → /data/.openclaw
      OPENCLAW_STATE_DIR: OPENCLAW_STATE_DIR,
      // Bind gateway to loopback — our wrapper is the public face
      OPENCLAW_GATEWAY_BIND: 'loopback',
    };

    // Match reference: openclaw gateway run --bind loopback --port 18789 --auth token --token <TOKEN>
    const args = [
      'gateway', 'run',
      '--bind', 'loopback',
      '--port', String(GATEWAY_PORT),
      '--allow-unconfigured',
    ];

    if (OPENCLAW_GATEWAY_TOKEN) {
      args.push('--auth', 'token', '--token', OPENCLAW_GATEWAY_TOKEN);
    }

    this._proc = spawn('openclaw', args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    this._proc.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      lines.forEach((line) => this._appendLog('stdout', line));
    });

    this._proc.stderr.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      lines.forEach((line) => this._appendLog('stderr', line));
    });

    this._proc.on('exit', (code, signal) => {
      log.warn(`Gateway process exited (code=${code}, signal=${signal})`);
      this._proc = null;

      if (this._state !== 'stopped') {
        this._setState('crashed');
        this._scheduleRestart();
      }
    });

    this._proc.on('error', (err) => {
      log.error('Failed to spawn openclaw:', err.message);
      this._setState('crashed');
      this._scheduleRestart();
    });
  }

  _scheduleRestart() {
    const delay = Math.min(
      BACKOFF_BASE_MS * Math.pow(2, this._restartCount),
      BACKOFF_MAX_MS
    );
    this._restartCount += 1;
    log.info(`Scheduling gateway restart in ${delay}ms (attempt #${this._restartCount})`);

    this._restartTimer = setTimeout(async () => {
      this._restartTimer = null;
      this._spawnProcess();
      try {
        await this._waitForReady();
        this._setState('running');
        log.info('✅ Gateway recovered after restart');
      } catch {
        log.error('Gateway failed to recover — will retry');
        this._scheduleRestart();
      }
    }, delay);
  }

  _waitForReady() {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + READY_TIMEOUT_MS;

      const poll = () => {
        if (Date.now() > deadline) {
          return reject(new Error(`Gateway not ready after ${READY_TIMEOUT_MS}ms`));
        }

        const socket = new net.Socket();
        socket.setTimeout(READY_POLL_INTERVAL_MS);

        socket.on('connect', () => {
          socket.destroy();
          resolve();
        });

        socket.on('error', () => {
          socket.destroy();
          setTimeout(poll, READY_POLL_INTERVAL_MS);
        });

        socket.on('timeout', () => {
          socket.destroy();
          setTimeout(poll, READY_POLL_INTERVAL_MS);
        });

        socket.connect(GATEWAY_PORT, GATEWAY_HOST);
      };

      poll();
    });
  }

  _appendLog(stream, line) {
    const entry = { ts: new Date().toISOString(), stream, line };
    this._logs.push(entry);
    if (this._logs.length > 500) this._logs.shift();
    this.emit('log', entry);
  }

  _setState(state) {
    this._state = state;
    this.emit('stateChange', state);
    log.info(`Gateway state → ${state}`);
  }
}

// Singleton
export const gatewayManager = new GatewayManager();