/**
 * MCP (Model Context Protocol) Client for Agentbot.
 *
 * Connects to Agentbot MCP servers over SSE or stdio transport,
 * activates/deactivates services, and calls tools with optional x402 payment.
 */

import { AgentbotError } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface McpClientConfig {
  /** Agentbot API key */
  apiKey: string;
  /** Base URL (default: https://agentbot.sh) */
  baseUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
}

export interface McpServerInfo {
  name: string;
  url: string;
  transport: 'sse' | 'stdio';
  status: 'active' | 'inactive';
}

export interface CallToolOptions {
  /** Tool name */
  tool: string;
  /** Tool arguments */
  args?: Record<string, unknown>;
  /** Service name (if calling a marketplace service) */
  service?: string;
  /** Auto-pay with x402 */
  payment?: { auto: boolean; maxAmount?: number };
}

export interface CallToolResult {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
}

export interface ActivateOptions {
  /** Name of the MCP service to activate */
  name: string;
  /** Agent ID to activate it for */
  agentId?: string;
}

export interface DeactivateOptions {
  /** Name of the MCP service to deactivate */
  name: string;
  agentId?: string;
}

// ─── McpClient ───────────────────────────────────────────────────────────────

export class McpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: McpClientConfig) {
    if (!config.apiKey) throw new AgentbotError('apiKey is required', 'MISSING_API_KEY');
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://agentbot.sh').replace(/\/+$/, '');
    this.timeout = config.timeout ?? 30_000;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        throw new AgentbotError(
          (errBody.error as string) ?? `HTTP ${res.status}`,
          (errBody.code as string) ?? 'MCP_ERROR',
          res.status,
        );
      }

      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof AgentbotError) throw err;
      throw new AgentbotError(
        err instanceof Error ? err.message : 'MCP request failed',
        'NETWORK_ERROR',
      );
    }
  }

  // ── Service Management ───────────────────────────────────────────────────

  /**
   * List all available MCP servers/services.
   */
  async listServers(): Promise<McpServerInfo[]> {
    const res = await this.request<{ servers: McpServerInfo[] }>('GET', '/api/mcp/servers');
    return res.servers;
  }

  /**
   * Activate an MCP service for an agent.
   * This starts the MCP server connection and makes its tools available.
   */
  async activate(options: ActivateOptions): Promise<{ status: string }> {
    return this.request<{ status: string }>('POST', '/api/mcp/activate', options);
  }

  /**
   * Deactivate an MCP service.
   * Stops the server connection and removes its tools from the agent.
   */
  async deactivate(options: DeactivateOptions): Promise<{ status: string }> {
    return this.request<{ status: string }>('POST', '/api/mcp/deactivate', options);
  }

  // ── Tool Invocation ──────────────────────────────────────────────────────

  /**
   * Call a tool on an MCP service.
   *
   * If the tool requires payment and `payment.auto` is true,
   * the SDK will handle x402 negotiation automatically.
   */
  async callTool(options: CallToolOptions): Promise<CallToolResult> {
    const { tool, args, service, payment } = options;

    const body: Record<string, unknown> = {
      tool,
      arguments: args ?? {},
    };

    if (service) body.service = service;
    if (payment) body.payment = payment;

    const res = await this.request<CallToolResult>('POST', '/api/mcp/invoke', body);
    return res;
  }

  // ── Tool Discovery ───────────────────────────────────────────────────────

  /**
   * List available tools for an MCP service.
   */
  async listTools(serviceName: string): Promise<Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>> {
    const res = await this.request<{ tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> }>(
      'GET',
      `/api/mcp/services/${serviceName}/tools`,
    );
    return res.tools;
  }

  /**
   * Get info about a specific MCP service.
   */
  async getService(serviceName: string): Promise<McpServerInfo & { tools: Array<{ name: string; description: string }> }> {
    return this.request<McpServerInfo & { tools: Array<{ name: string; description: string }> }>(
      'GET',
      `/api/mcp/services/${serviceName}`,
    );
  }
}

// ─── McpServer (for building MCP services) ──────────────────────────────────

export interface McpServerConfig {
  name: string;
  version: string;
  pricing?: Record<string, { price: number; token: string; network: string }>;
}

export interface McpToolDefinition {
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolHandler {
  (args: Record<string, unknown>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

export interface ServerStartOptions {
  transport: 'sse' | 'stdio';
  port?: number;
}

/**
 * Build an MCP server that exposes tools over SSE or stdio.
 *
 * Usage:
 *   const server = new McpServer({ name: 'my-tools', version: '1.0.0' });
 *   server.tool('do_thing', { description: '...', inputSchema: {...} }, handler);
 *   server.start({ transport: 'sse', port: 8402 });
 */
export class McpServer {
  readonly name: string;
  readonly version: string;
  readonly pricing?: Record<string, { price: number; token: string; network: string }>;
  private tools = new Map<string, { definition: McpToolDefinition; handler: McpToolHandler }>();

  constructor(config: McpServerConfig) {
    this.name = config.name;
    this.version = config.version;
    this.pricing = config.pricing;
  }

  /**
   * Register a tool on this MCP server.
   */
  tool(name: string, definition: McpToolDefinition, handler: McpToolHandler): void {
    this.tools.set(name, { definition, handler });
  }

  /**
   * Get all registered tools (for introspection).
   */
  getTools(): Array<{ name: string; definition: McpToolDefinition }> {
    return Array.from(this.tools.entries()).map(([name, { definition }]) => ({
      name,
      definition,
    }));
  }

  /**
   * Start the MCP server.
   *
   * For 'sse' transport, starts an HTTP server with SSE endpoint.
   * For 'stdio' transport, reads JSON-RPC from stdin and writes to stdout.
   */
  async start(options: ServerStartOptions): Promise<void> {
    const transport = options.transport ?? 'sse';

    if (transport === 'stdio') {
      await this.startStdio();
    } else {
      await this.startSSE(options.port ?? 8402);
    }
  }

  private async startStdio(): Promise<void> {
    const readline = await import('node:readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line: string) => {
      try {
        const request = JSON.parse(line) as {
          id: string | number;
          method: string;
          params?: Record<string, unknown>;
        };

        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch {
        // Ignore malformed lines
      }
    });
  }

  private async startSSE(port: number): Promise<void> {
    const http = await import('node:http');

    const server = http.createServer(async (req, res) => {
      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', name: this.name, version: this.version }));
        return;
      }

      if (req.method === 'GET' && req.url === '/tools') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ tools: this.getTools() }));
        return;
      }

      if (req.method === 'POST' && req.url === '/invoke') {
        let body = '';
        for await (const chunk of req) body += chunk;

        try {
          const request = JSON.parse(body) as {
            id: string | number;
            method: string;
            params?: Record<string, unknown>;
          };

          const response = await this.handleRequest(request);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
        return;
      }

      // SSE endpoint
      if (req.method === 'GET' && req.url === '/sse') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write('data: {"type":"connected"}\n\n');

        const keepalive = setInterval(() => {
          res.write('data: {"type":"ping"}\n\n');
        }, 30_000);

        req.on('close', () => clearInterval(keepalive));
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(port, () => {
      console.log(`[mcp] ${this.name} v${this.version} listening on :${port}`);
    });
  }

  private async handleRequest(request: {
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
  }): Promise<unknown> {
    const { id, method, params } = request;

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: this.getTools().map(({ name, definition }) => ({
            name,
            description: definition.description,
            inputSchema: definition.inputSchema,
          })),
        },
      };
    }

    if (method === 'tools/call') {
      const toolName = params?.name as string;
      const args = (params?.arguments as Record<string, unknown>) ?? {};

      const tool = this.tools.get(toolName);
      if (!tool) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Tool not found: ${toolName}` },
        };
      }

      try {
        const result = await tool.handler(args);
        return { jsonrpc: '2.0', id, result };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: err instanceof Error ? err.message : 'Tool execution failed',
          },
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Unknown method: ${method}` },
    };
  }
}
