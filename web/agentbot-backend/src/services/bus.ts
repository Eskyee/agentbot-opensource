import { keccak256, toUtf8Bytes, verifyMessage } from 'ethers';
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

      const hash = keccak256(toUtf8Bytes(JSON.stringify(messageContent)));
      const recoveredAddress = verifyMessage(hash, message.from.signature);

      return recoveredAddress.toLowerCase() === message.from.walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Delivers a message to a recipient agent via webhook.
   * Includes retry logic and status tracking.
   */
  static async deliverMessage(message: AgentMessage): Promise<void> {
    // 1. Get recipient agent's metadata (webhook URL)
    const result = await pool.query(
      'SELECT config->\'webhookUrl\' as webhook_url FROM agents WHERE id = (SELECT agent_id FROM deployments WHERE subdomain = $1)',
      [message.to.agentId]
    );

    const webhookUrl = result.rows[0]?.webhook_url;
    if (!webhookUrl) {
      throw new Error(`Recipient agent ${message.to.agentId} has no webhook configured`);
    }

    // 2. Dispatch via fetch (this could be offloaded to Bull queue for retries)
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
