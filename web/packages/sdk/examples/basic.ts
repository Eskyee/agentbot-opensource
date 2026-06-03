/**
 * @agentbot/sdk — Basic Usage Example
 *
 * Demonstrates connecting to Agentbot, chatting, listing models,
 * and calling MCP tools.
 *
 * Run:
 *   AGENTBOT_API_KEY=your-key npx tsx examples/basic.ts
 */

import { AgentbotClient, McpClient, x402 } from '@agentbot/sdk';

const API_KEY = process.env.AGENTBOT_API_KEY ?? '';
if (!API_KEY) {
  console.error('Set AGENTBOT_API_KEY environment variable');
  process.exit(1);
}

async function main() {
  // ── 1. Connect to Agentbot ────────────────────────────────────────────────
  const client = new AgentbotClient({
    apiKey: API_KEY,
    baseUrl: 'https://agentbot.sh',
    timeout: 30_000,
    retries: 2,
  });

  console.log('✅ Connected to Agentbot\n');

  // ── 2. Health Check ───────────────────────────────────────────────────────
  try {
    const health = await client.health();
    console.log(`🏥 Status: ${health.status} | Version: ${health.version} | Uptime: ${health.uptime}s\n`);
  } catch (err) {
    console.warn('⚠️  Health check failed (may be unauthenticated):', (err as Error).message, '\n');
  }

  // ── 3. List Models ────────────────────────────────────────────────────────
  console.log('📦 Available Models:');
  try {
    const models = await client.models();
    for (const model of models.slice(0, 10)) {
      console.log(`  • ${model.name} (${model.id}) — ctx: ${model.contextLength}`);
    }
    if (models.length > 10) console.log(`  ... and ${models.length - 10} more`);
    console.log();
  } catch (err) {
    console.warn('⚠️  Could not list models:', (err as Error).message, '\n');
  }

  // ── 4. Send a Chat Completion ─────────────────────────────────────────────
  console.log('💬 Sending chat message...');
  try {
    const response = await client.chat({
      message: 'What BPM range works best for a peak-time techno set?',
    });

    console.log(`  Agent: ${response.agent}`);
    console.log(`  Reply: ${response.reply}`);
    if (response.toolCalls?.length) {
      console.log(`  Tools used: ${response.toolCalls.map((t: { name: string }) => t.name).join(', ')}`);
    }
    console.log();
  } catch (err) {
    console.warn('⚠️  Chat failed:', (err as Error).message, '\n');
  }

  // ── 5. Stream a Chat Response ─────────────────────────────────────────────
  console.log('📡 Streaming chat response:');
  try {
    const stream = await client.chatStream({
      message: 'Give me 3 classic Detroit techno tracks',
    });

    for await (const chunk of stream) {
      if (chunk.text) process.stdout.write(chunk.text);
    }
    console.log('\n');
  } catch (err) {
    console.warn('⚠️  Streaming failed:', (err as Error).message, '\n');
  }

  // ── 6. List Agents ────────────────────────────────────────────────────────
  console.log('🤖 Your Agents:');
  try {
    const agents = await client.agents.list();
    if (agents.length === 0) {
      console.log('  (none — create one with client.agents.create())');
    }
    for (const agent of agents) {
      console.log(`  • ${agent.name} (${agent.id}) — ${agent.status} — model: ${agent.model}`);
    }
    console.log();
  } catch (err) {
    console.warn('⚠️  Could not list agents:', (err as Error).message, '\n');
  }

  // ── 7. Call an MCP Tool ───────────────────────────────────────────────────
  console.log('🔧 Calling MCP tool...');
  const mcp = new McpClient({ apiKey: API_KEY });

  try {
    // Discover available MCP services
    const servers = await mcp.listServers();
    console.log(`  Found ${servers.length} MCP server(s)`);

    if (servers.length > 0) {
      const server = servers[0];
      console.log(`  Calling tool on ${server.name}...`);

      const tools = await mcp.listTools(server.name);
      if (tools.length > 0) {
        console.log(`  Available tools: ${tools.map((t: { name: string }) => t.name).join(', ')}`);
      }
    }
    console.log();
  } catch (err) {
    console.warn('⚠️  MCP call failed:', (err as Error).message, '\n');
  }

  // ── 8. Marketplace Discovery ──────────────────────────────────────────────
  console.log('🏪 Discovering marketplace services...');
  try {
    const { services } = await client.marketplace.discover({ maxPrice: 0.05 });
    for (const svc of services) {
      console.log(`  • ${svc.name} — $${svc.pricePerCall}/call on ${svc.network}`);
      console.log(`    Tools: ${svc.tools.map((t: { name: string }) => t.name).join(', ')}`);
    }
    console.log();
  } catch (err) {
    console.warn('⚠️  Marketplace discovery failed:', (err as Error).message, '\n');
  }

  // ── 9. x402 Payment Example ───────────────────────────────────────────────
  console.log('💰 x402 payment example (auto-pay):');
  try {
    const result = await client.mcp.invoke({
      service: 'gecko-data',
      tool: 'get_pool_data',
      args: { pool: '0xabc...', network: 'base' },
      payment: x402.auto(0.05), // auto-pay up to $0.05
    });

    console.log(`  Result:`, result.data);
    if (result.payment) {
      console.log(`  Paid: $${result.payment.amount} ${result.payment.token}`);
    }
  } catch (err) {
    console.warn('⚠️  x402 payment failed:', (err as Error).message);
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
