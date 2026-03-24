import { keccak256, toUtf8Bytes, verifyMessage as ethersVerifyMessage } from 'ethers';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
   */
  static async verifyMessage(message: AgentMessage): Promise<boolean> {
    try {
      // Reconstruct the message hash (excluding the signature itself)
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

      return recoveredAddress.toLowerCase() === message.from.walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
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
   */
  static async deliverMessage(message: AgentMessage): Promise<void> {
    // 0. Verify message signature before doing anything
    const isValid = await this.verifyMessage(message);
    if (!isValid) {
      throw new Error(`Message ${message.messageId} has an invalid signature — delivery refused`);
    }

    // 1. Get recipient agent's metadata (webhook URL)
    const result = await pool.query(
      'SELECT config->\'webhookUrl\' as webhook_url FROM agents WHERE id = (SELECT agent_id FROM deployments WHERE subdomain = $1)',
      [message.to.agentId]
    );

    const webhookUrl = result.rows[0]?.webhook_url;
    if (!webhookUrl) {
      throw new Error(`Recipient agent ${message.to.agentId} has no webhook configured`);
    }

    // 2. Validate webhook URL to prevent SSRF
    this.validateWebhookUrl(webhookUrl);

    // 3. Dispatch via fetch (this could be offloaded to Bull queue for retries)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Protocol-Version': message.version
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Message delivery failed for ${message.messageId}: ${response.statusText}`);
    }

    // 3. Log the successful coordination
    await pool.query(
      'INSERT INTO treasury_transactions (type, category, amount_usdc, description, metadata) VALUES ($1, $2, $3, $4, $5)',
      ['coordination', 'agent_message', 0, `Message ${message.action} delivered to ${message.to.agentId}`, JSON.stringify(message)]
    );
  }
}
