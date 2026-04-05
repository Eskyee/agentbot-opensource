/**
 * services/pairingService.js
 *
 * Manages device pairing state via the openclaw CLI.
 *
 * Uses `openclaw devices list/approve/reject --token <TOKEN>` commands
 * (same approach as the reference railway template) instead of reading
 * JSON files directly, which is more reliable across openclaw versions.
 *
 * Also watches ~/.openclaw/nodes/pending.json for real-time SSE updates.
 */

import { EventEmitter } from 'events';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import { OPENCLAW_HOME, DATA_DIR, OPENCLAW_GATEWAY_TOKEN } from '../config/index.js';
import { log } from '../utils/log.js';

const execFileAsync = promisify(execFile);

const PENDING_PATH = path.join(OPENCLAW_HOME, 'nodes', 'pending.json');
const PAIRED_PATH = path.join(OPENCLAW_HOME, 'nodes', 'paired.json');

class PairingService extends EventEmitter {
  constructor() {
    super();
    this._watcher = null;
    this._startWatching();
  }

  /**
   * List devices using the openclaw CLI.
   * Returns { pending: [...], paired: [...] } or falls back to file reads.
   */
  async listDevices() {
    if (!OPENCLAW_GATEWAY_TOKEN) {
      return { pending: await this._readFile(PENDING_PATH, []), paired: await this._readFile(PAIRED_PATH, []) };
    }

    try {
      const env = { ...process.env, HOME: DATA_DIR, OPENCLAW_STATE_DIR: OPENCLAW_HOME };
      const { stdout } = await execFileAsync(
        'openclaw',
        ['devices', 'list', '--json', '--token', OPENCLAW_GATEWAY_TOKEN],
        { env, timeout: 10_000 }
      );

      log.info(`devices list output: ${stdout}`);

      // Extract JSON from output (CLI may print extra text before the JSON)
      const jsonMatch = stdout.match(/(\{[\s\S]*\}|\[[\s\S]*\])\s*$/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        return {
          pending: Array.isArray(data.pending) ? data.pending : [],
          paired: Array.isArray(data.paired) ? data.paired : [],
        };
      }

      log.warn('No JSON found in devices list output, falling back to file reads');
    } catch (err) {
      log.warn(`devices list CLI failed (${err.message}), falling back to file reads`);
    }

    // Fallback to file reads
    return {
      pending: await this._readFile(PENDING_PATH, []),
      paired: await this._readFile(PAIRED_PATH, []),
    };
  }

  async getPending() {
    const { pending } = await this.listDevices();
    return pending;
  }

  async getPaired() {
    const { paired } = await this.listDevices();
    return paired;
  }

  /**
   * Approve a pending pair request.
   * Uses: openclaw devices approve [requestId] --token <TOKEN>
   */
  async approve(requestId) {
    log.info(`Approving pairing request: ${requestId}`);
    const env = { ...process.env, HOME: DATA_DIR, OPENCLAW_STATE_DIR: OPENCLAW_HOME };
    const args = ['devices', 'approve'];
    if (requestId) {
      args.push(String(requestId));
    } else {
      args.push('--latest');
    }
    if (OPENCLAW_GATEWAY_TOKEN) {
      args.push('--token', OPENCLAW_GATEWAY_TOKEN);
    }

    const { stdout } = await execFileAsync('openclaw', args, { env, timeout: 10_000 });
    log.info(`Approve result: ${stdout}`);
    this.emit('pairingUpdate', { action: 'approved', requestId });
  }

  async reject(requestId) {
    log.info(`Rejecting pairing request: ${requestId}`);
    const env = { ...process.env, HOME: DATA_DIR, OPENCLAW_STATE_DIR: OPENCLAW_HOME };
    const args = ['devices', 'reject', String(requestId)];
    if (OPENCLAW_GATEWAY_TOKEN) {
      args.push('--token', OPENCLAW_GATEWAY_TOKEN);
    }

    const { stdout } = await execFileAsync('openclaw', args, { env, timeout: 10_000 });
    log.info(`Reject result: ${stdout}`);
    this.emit('pairingUpdate', { action: 'rejected', requestId });
  }

  async revoke(deviceId, role) {
    log.info(`Revoking device: ${deviceId} role: ${role}`);
    const env = { ...process.env, HOME: DATA_DIR, OPENCLAW_STATE_DIR: OPENCLAW_HOME };

    // Step 1: Revoke the device token (invalidates auth) — best-effort, token may already be revoked
    if (role) {
      try {
        const revokeArgs = ['devices', 'revoke', '--device', deviceId, '--role', role];
        if (OPENCLAW_GATEWAY_TOKEN) revokeArgs.push('--token', OPENCLAW_GATEWAY_TOKEN);
        const { stdout: revokeOut } = await execFileAsync('openclaw', revokeArgs, { env, timeout: 10_000 });
        log.info(`Revoke result: ${revokeOut}`);
      } catch (err) {
        log.warn(`Revoke token failed (may already be revoked): ${err.message}`);
      }
    }

    // Step 2: Remove the device entry from the paired list
    const removeArgs = ['devices', 'remove', deviceId];
    if (OPENCLAW_GATEWAY_TOKEN) removeArgs.push('--token', OPENCLAW_GATEWAY_TOKEN);
    const { stdout: removeOut } = await execFileAsync('openclaw', removeArgs, { env, timeout: 10_000 });
    log.info(`Remove result: ${removeOut}`);

    this.emit('pairingUpdate', { action: 'revoked', deviceId });
  }

  // ─── Private ─────────────────────────────────────────────────────

  async _readFile(filePath, defaultVal) {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return Object.entries(parsed).map(([id, v]) => ({ id, ...v }));
    } catch {
      return defaultVal;
    }
  }

  _startWatching() {
    // Watch for changes to the pending file so we can push SSE updates
    this._watcher = chokidar.watch(PENDING_PATH, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
    });

    this._watcher.on('change', async () => {
      try {
        const pending = await this.getPending();
        this.emit('pendingChanged', pending);
        log.info(`Pairing pending list updated (${pending.length} pending)`);
      } catch { /* file may not exist yet */ }
    });

    this._watcher.on('add', async () => {
      try {
        const pending = await this.getPending();
        this.emit('pendingChanged', pending);
      } catch { /* ignore */ }
    });

    this._watcher.on('error', (err) => {
      log.warn('Pairing file watcher error (non-fatal):', err.message);
    });
  }
}

export const pairingService = new PairingService();
