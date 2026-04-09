/**
 * services/terminalService.js
 *
 * Manages PTY (pseudo-terminal) sessions for the web terminal panel.
 *
 * One PTY per WebSocket connection. When the WS closes, the PTY is killed.
 * Spawns `openclaw tui` (interactive terminal) — deferred until the first
 * 'resize' message so we know the correct terminal dimensions.
 *
 * Protocol (binary-safe, text frames):
 *   Client → Server:
 *     { type: 'input', data: '<keystrokes>' }
 *     { type: 'resize', cols: N, rows: N }
 *
 *   Server → Client:
 *     { type: 'output', data: '<terminal output>' }
 *     { type: 'exit',   code: N }
 */

let pty = null;
import('node-pty').then(m => { pty = m.default; }).catch(() => { console.warn('node-pty not available — terminal feature disabled'); });
import { WebSocketServer } from 'ws';
import { DATA_DIR, OPENCLAW_HOME, OPENCLAW_STATE_DIR } from '../config/index.js';
import { log } from '../utils/log.js';

// Maximum simultaneous PTY sessions (guard against resource exhaustion)
const MAX_SESSIONS = 5;

// Active sessions: Map<sessionId, { ptyProc, ws }>
const sessions = new Map();
let sessionCounter = 0;

/**
 * Creates a WebSocket server for terminal connections.
 * Uses noServer mode — the caller (server.js) must route upgrade
 * requests to terminalWss.handleUpgrade() manually.
 *
 * IMPORTANT: We must NOT use { server: httpServer } because the ws
 * library auto-registers an upgrade handler that calls abortHandshake(400)
 * for non-matching paths, which destroys the socket before the gateway
 * WS proxy handler can forward it. noServer avoids this.
 */
export const terminalWss = new WebSocketServer({ noServer: true });

export function attachTerminalWebSocket(httpServer) {
  terminalWss.on('connection', (ws, req) => {
    if (sessions.size >= MAX_SESSIONS) {
      ws.send(JSON.stringify({
        type: 'output',
        data: '\r\n\x1b[31m[Too many terminal sessions open. Close another tab and try again.]\x1b[0m\r\n',
      }));
      ws.close(1013, 'Too many sessions');
      return;
    }

    const sessionId = ++sessionCounter;
    log.info(`Terminal WS connected (session #${sessionId})`);

    // ── Deferred PTY spawn ───────────────────────────────────────
    // Wait for first 'resize' message to get correct terminal dimensions.

    const env = {
      ...process.env,
      HOME:                   DATA_DIR,
      OPENCLAW_STATE_DIR:     OPENCLAW_STATE_DIR,
      OPENCLAW_WORKSPACE_DIR: `${OPENCLAW_HOME}/workspace`,
      TERM:                   'xterm-256color',
      COLORTERM:              'truecolor',
    };

    let ptyProc = null;
    let ptyStarted = false;

    function spawnPty(cols, rows) {
      if (ptyStarted) return;
      ptyStarted = true;

      try {
        ptyProc = pty.spawn('openclaw', ['tui'], {
          name:  'xterm-256color',
          cols:  cols || 80,
          rows:  rows || 24,
          cwd:   `${OPENCLAW_HOME}/workspace`,
          env,
        });
      } catch (err) {
        log.error('Failed to spawn PTY:', err.message);
        ws.send(JSON.stringify({
          type: 'output',
          data: `\r\n\x1b[31m[Failed to start terminal: ${err.message}]\x1b[0m\r\n`,
        }));
        ws.close();
        return;
      }

      log.info(`PTY spawned for session #${sessionId} (${cols}x${rows})`);
      sessions.set(sessionId, { ptyProc, ws });

      // ── PTY → WS ────────────────────────────────────────────
      ptyProc.onData((data) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'output', data }));
        }
      });

      ptyProc.onExit(({ exitCode }) => {
        log.info(`Terminal session #${sessionId} exited (code=${exitCode})`);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
          ws.close();
        }
        sessions.delete(sessionId);
      });
    }

    // Track session even before PTY spawns (for cleanup)
    sessions.set(sessionId, { ptyProc: null, ws });

    // ── WS → PTY ──────────────────────────────────────────────────
    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case 'input':
          if (typeof msg.data === 'string' && ptyProc) {
            ptyProc.write(msg.data);
          }
          break;

        case 'resize':
          if (
            typeof msg.cols === 'number' &&
            typeof msg.rows === 'number' &&
            msg.cols > 0 && msg.rows > 0 &&
            msg.cols <= 500 && msg.rows <= 200
          ) {
            if (!ptyStarted) {
              spawnPty(msg.cols, msg.rows);
            } else if (ptyProc) {
              ptyProc.resize(msg.cols, msg.rows);
            }
          }
          break;

        default:
          log.debug('Terminal: unknown message type:', msg.type);
      }
    });

    // ── WS close — kill PTY ───────────────────────────────────────
    ws.on('close', () => {
      log.info(`Terminal WS closed (session #${sessionId})`);
      if (sessions.has(sessionId)) {
        try { if (ptyProc) ptyProc.kill(); } catch { /* already dead */ }
        sessions.delete(sessionId);
      }
    });

    ws.on('error', (err) => {
      log.warn(`Terminal WS error (session #${sessionId}):`, err.message);
      try { if (ptyProc) ptyProc.kill(); } catch { /* ignore */ }
      sessions.delete(sessionId);
    });
  });

  terminalWss.on('error', (err) => {
    log.error('Terminal WebSocket server error:', err.message);
  });

  log.info('Terminal WebSocket server attached at /ws/terminal');
}

/**
 * Returns how many active PTY sessions exist.
 */
export function getActiveSessionCount() {
  return sessions.size;
}
