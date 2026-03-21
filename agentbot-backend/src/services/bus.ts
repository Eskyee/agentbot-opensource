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
  payload: any;
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
   * Only allows HTTPS to public hostnames.
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

    const hostname = parsed.hostname.toLowerCase();
    // Block private / loopback / link-local ranges
    const blocked = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
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
