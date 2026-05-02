import { keccak256, toUtf8Bytes, verifyMessage as ethersVerifyMessage } from 'ethers';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Replay window for /bus/send messages — same 5-minute skew as signature.ts.
// Captured signed messages older than this are rejected outright; messages
// inside the window are deduped via the agent_message_nonces table.
const BUS_REPLAY_WINDOW_MS = 5 * 60 * 1000;

export interface VerifyOptions {
  /** Reject messages whose timestamp is outside ±BUS_REPLAY_WINDOW_MS. */
  enforceTimestamp?: boolean;
}

export interface VerifyResult {
  ok: boolean;
  reason?: 'invalid_signature' | 'invalid_timestamp' | 'expired' | 'verify_error';
}

export interface AgentMessage {
  version: string;
  messageId: string;
  timestamp: string;
  from: {
    agentId: string;
    agentType: string;
    walletAddress: string;
    signature: string;
  };
  to: {
    agentId: string;
    agentType: string;
  };
  action: string;
  payload: Record<string, unknown>;
  metadata?: {
    replyTo?: string;
    expiresAt?: string;
    priority?: string;
  };
}

export class AgentBusService {
  /**
   * Verifies the authenticity of an incoming agent message.
   * Ensures the message was signed by the stated wallet address.
   *
   * Boolean overload kept for backwards-compat with existing callers; new
   * callers should use `verifyMessageDetailed` to distinguish bad-signature
   * from stale-timestamp rejections.
   */
  static async verifyMessage(message: AgentMessage, options: VerifyOptions = {}): Promise<boolean> {
    return (await this.verifyMessageDetailed(message, options)).ok;
  }

  static async verifyMessageDetailed(
    message: AgentMessage,
    options: VerifyOptions = {}
  ): Promise<VerifyResult> {
    try {
      // Optional replay protection. The bus historically didn't enforce a
      // timestamp window, so a captured signed message could be replayed
      // forever. /bus/send sets enforceTimestamp=true (paired with the
      // agent_message_nonces table for dedup inside the window).
      if (options.enforceTimestamp) {
        const ts = Date.parse(message.timestamp);
        if (Number.isNaN(ts)) {
          return { ok: false, reason: 'invalid_timestamp' };
        }
        if (Math.abs(Date.now() - ts) > BUS_REPLAY_WINDOW_MS) {
          return { ok: false, reason: 'expired' };
        }
      }

      // Reconstruct the message hash (excluding the signature itself).
      // NOTE: We deliberately keep `JSON.stringify` here (not the canonical
      // form) because external agents already sign messages this way; moving
      // to canonical JSON would require a coordinated SDK migration and a
      // protocol-version bump. Tracked for v2.0 of the bus protocol.
      const messageContent = {
        version: message.version,
        messageId: message.messageId,
        timestamp: message.timestamp,
        from: {
          agentId: message.from.agentId,
          agentType: message.from.agentType,
          walletAddress: message.from.walletAddress
        },
        to: message.to,
        action: message.action,
        payload: message.payload
      };

      const hash = keccak256(
        toUtf8Bytes(JSON.stringify(messageContent))
      );

      const recoveredAddress = ethersVerifyMessage(
        hash,
        message.from.signature
      );

      const ok = recoveredAddress.toLowerCase() === message.from.walletAddress.toLowerCase();
      return ok ? { ok: true } : { ok: false, reason: 'invalid_signature' };
    } catch (error) {
      console.error('Signature verification failed:', error);
      return { ok: false, reason: 'verify_error' };
    }
  }

  /**
   * Records a successfully-verified messageId so the same signed payload
   * can't be replayed inside the timestamp window. Returns true if the
   * nonce was new, false if it had already been processed.
   *
   * Stored rows expire after 1 hour (a multiple of BUS_REPLAY_WINDOW_MS) and
   * a periodic sweep keeps the table small.
   */
  static async claimNonce(messageId: string, fromAddress: string): Promise<boolean> {
    if (!messageId) return false;
    try {
      const result = await pool.query(
        `INSERT INTO agent_message_nonces (message_id, from_address)
         VALUES ($1, $2)
         ON CONFLICT (message_id) DO NOTHING
         RETURNING message_id`,
        [messageId, fromAddress.toLowerCase()]
      );
      return result.rowCount === 1;
    } catch (error) {
      // If the table doesn't exist yet (race on first boot), let the message
      // through rather than blocking the whole bus. db-init.ts will create it
      // shortly. We log so the gap is visible.
      console.warn('[Bus] claimNonce DB error (allowing message through):', error);
      return true;
    }
  }

  /** Sweep nonces older than 1 hour. Cheap; bounded by index. */
  static async cleanupExpiredNonces(): Promise<void> {
    try {
      await pool.query(
        `DELETE FROM agent_message_nonces WHERE processed_at < NOW() - INTERVAL '1 hour'`
      );
    } catch (error) {
      console.warn('[Bus] cleanupExpiredNonces failed:', error);
    }
  }

  /**
   * Validates a webhook URL to prevent SSRF attacks.
   * Only allows HTTPS to public, routable hostnames.
   *
   * LOW-04 FIX: extended blocklist to cover:
   *  - 0.0.0.0 (wildcard bind address)
   *  - 100.64–127.x (IANA shared / carrier-grade NAT space)
   *  - Full IPv6 unique-local /7 range (fc00:: – fdff::, not just fc00::)
   *  - IPv6-mapped IPv4 (::ffff:...) which can bypass simple IPv4 checks
   *  - IPv4-in-IPv6 compatible addresses (::x.x.x.x)
   *  - Zone IDs in IPv6 addresses (fe80::1%eth0 → hostname contains %)
   *
   * DNS rebinding (attacker controls DNS to return a private IP after the
   * check passes) cannot be prevented here. Mitigate with network-level
   * egress filtering on the host.
   */
  private static validateWebhookUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid webhook URL: ${url}`);
    }

    if (parsed.protocol !== 'https:') {
      throw new Error(`Webhook URL must use HTTPS: ${url}`);
    }

    // NOTE: In Node.js 18+, URL.hostname preserves IPv6 brackets (e.g. [::1] stays as [::1]).
    // We strip them before regex matching so patterns work correctly.
    const rawHostname = parsed.hostname.toLowerCase();
    const hostname    = rawHostname.replace(/^\[|\]$/g, '');

    // Reject any hostname containing a zone ID (e.g. fe80::1%eth0 → fe80::1%25eth0)
    // URL() percent-encodes the '%' as '%25', so we check after stripping brackets.
    if (hostname.includes('%')) {
      throw new Error(`Webhook URL contains an IPv6 zone ID (disallowed): ${url}`);
    }

    const blocked: RegExp[] = [
      // IPv4 loopback
      /^localhost$/,
      /^127\./,
      // IPv4 wildcard
      /^0\.0\.0\.0$/,
      // RFC 1918 private
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      // IPv4 link-local (also covers AWS/GCP metadata 169.254.169.254)
      /^169\.254\./,
      // IANA shared address space / carrier-grade NAT (RFC 6598): 100.64.0.0/10
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
      // IPv6 loopback
      /^::1$/,
      // IPv6 unique local (fc00::/7 covers fc00:: – fdff::)
      /^f[cd][0-9a-f]{0,2}:/i,
      // IPv6 link-local
      /^fe[89ab][0-9a-f]:/i, // fe80:: – febf::
      // IPv6-mapped IPv4 (::ffff:...) and IPv4-compatible (::x.x.x.x).
      // Node.js URL normalises dotted-decimal to hex (e.g. ::ffff:192.168.1.1
      // becomes ::ffff:c0a8:101), so we match the ::ffff: prefix and also catch
      // all other :: addresses (loopback, IPv4-compatible etc.) via /^::/.
      /^::ffff:/i,
      /^::/,   // catches ::1, ::7f00:1 (::127.0.0.1 in hex), ::a00:1 (::10.0.0.1), etc.
    ];

    if (blocked.some((re) => re.test(hostname))) {
      throw new Error(`Webhook URL targets a private/internal address: ${url}`);
    }
  }

  /**
   * Delivers a message to a recipient agent via webhook.
   * Verifies sender signature and validates webhook URL before dispatch.
   *
   * Retries up to 3 times with exponential backoff on transient network /
   * 5xx failures. The recipient SHOULD treat the messageId as an idempotency
   * key — the X-Agent-Message-Id header makes that explicit.
   */
  static async deliverMessage(message: AgentMessage): Promise<void> {
    // 0. Verify message signature before doing anything.
    const isValid = await this.verifyMessage(message);
    if (!isValid) {
      throw new Error(`Message ${message.messageId} has an invalid signature — delivery refused`);
    }

    // 1. Get recipient agent's metadata (webhook URL).
    const result = await pool.query(
      'SELECT config->\'webhookUrl\' as webhook_url FROM agents WHERE id = (SELECT agent_id FROM deployments WHERE subdomain = $1)',
      [message.to.agentId]
    );

    const webhookUrl = result.rows[0]?.webhook_url;
    if (!webhookUrl) {
      throw new Error(`Recipient agent ${message.to.agentId} has no webhook configured`);
    }

    // 2. Validate webhook URL to prevent SSRF.
    this.validateWebhookUrl(webhookUrl);

    // 3. Dispatch with bounded retries on transient failures.
    const MAX_ATTEMPTS = 3;
    let lastError: Error | null = null;
    // Serialize once so retries send byte-identical bodies (recipients dedupe
    // on X-Agent-Message-Id but byte-stable bodies make audit logs cleaner).
    const body = JSON.stringify(message);
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Protocol-Version': message.version,
            // Idempotency key — recipients should dedupe on this header.
            'X-Agent-Message-Id': message.messageId,
            'X-Agent-Delivery-Attempt': String(attempt),
          },
          body,
          signal: AbortSignal.timeout(10_000), // 10s — prevent indefinite hang on slow agents.
        });

        if (response.ok) {
          // 4. Log the successful coordination.
          await pool.query(
            'INSERT INTO treasury_transactions (category, action, amount_usdc, metadata) VALUES ($1, $2, $3, $4)',
            ['agent_message', `Message ${message.action} delivered to ${message.to.agentId}`, 0, JSON.stringify(message)]
          );
          return;
        }

        // 4xx (other than 408/429) is a permanent failure — do not retry.
        const status = response.status;
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw new Error(`Message delivery failed for ${message.messageId}: HTTP ${status} ${response.statusText}`);
        }
        lastError = new Error(`HTTP ${status} ${response.statusText}`);
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('Message delivery failed')) {
          throw err; // permanent failure
        }
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      if (attempt < MAX_ATTEMPTS) {
        const backoffMs = 250 * 2 ** (attempt - 1); // 250, 500, 1000
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    throw new Error(
      `Message delivery failed for ${message.messageId} after ${MAX_ATTEMPTS} attempts: ${lastError?.message ?? 'unknown'}`
    );
  }
}
