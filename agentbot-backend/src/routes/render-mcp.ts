import { Router, Request, Response } from 'express';

/**
 * Render MCP Server Integration
 * Implements Model Context Protocol for Render infrastructure management
 * Allows AI apps (Cursor, Claude Code, etc.) to manage Render resources
 * 
 * Uses Render's REST API: https://api.render.com/docs
 */

const router = Router();

const RENDER_API_BASE = 'https://api.render.com/v1';
const RENDER_API_KEY = process.env.RENDER_API_KEY || '';

interface MCPRequest {
  jsonrpc: string;
  method: string;
  params?: Record<string, unknown>;
  id: string | number;
}

interface MCPResponse {
  jsonrpc: string;
  result?: unknown;
  error?: { code: number; message: string };
  id: string | number;
}

/**
 * MCP Tools for Render infrastructure
 * See: https://render.com/docs/api-reference
 */
const AVAILABLE_TOOLS = {
  // Service tools
  list_services: 'List all services in account',
  get_service: 'Get service details by ID',
  create_service: 'Create new service (web, worker, cron, static)',
  update_service: 'Update service configuration',
  delete_service: 'Delete a service',
  
  // Deployment tools
  list_deploys: 'List deploy history for service',
  get_deploy: 'Get deploy details',
  trigger_deploy: 'Trigger a new deployment',
  
  // Environment variables
  list_env_vars: 'List environment variables for service',
  set_env_var: 'Set environment variable',
  delete_env_var: 'Delete environment variable',
  
  // Logging tools
  get_service_logs: 'Fetch service logs',
  
  // Database tools
  list_postgres: 'List all Postgres databases',
  create_postgres: 'Create new Postgres database',
  get_postgres: 'Get database details',
  
  // Redis tools
  list_redis: 'List all Redis instances',
  create_redis: 'Create new Redis instance',
  get_redis: 'Get Redis instance details',
};

// Helper to make Render API calls
async function callRenderAPI(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<unknown> {
  if (!RENDER_API_KEY) {
    throw new Error('RENDER_API_KEY not configured');
  }

  const url = `${RENDER_API_BASE}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RENDER_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Render API error (${response.status}): ${error}`);
  }

  return response.json();
}

// MCP Server info
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    name: 'Render MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol integration for Render infrastructure management',
    documentation: 'https://render.com/docs/api-reference',
    api_base: RENDER_API_BASE,
    configured: !!RENDER_API_KEY,
    tools: AVAILABLE_TOOLS,
  });
});

// List available MCP tools
router.get('/tools', (_req: Request, res: Response) => {
  res.json({
    description: 'MCP Tools for managing Render infrastructure',
    tools: Object.entries(AVAILABLE_TOOLS).map(([id, description]) => ({
      id,
      description,
      category: getCategoryForTool(id),
    })),
    api_docs: 'https://render.com/docs/api-reference',
  });
});

// Configuration instructions for different IDEs
router.get('/config', (_req: Request, res: Response) => {
  const isConfigured = !!RENDER_API_KEY;
  
  res.json({
    status: isConfigured ? 'configured' : 'not-configured',
    instructions: {
      setup: 'Get your API key from https://dashboard.render.com/account/api-tokens',
      environment: {
        RENDER_API_KEY: isConfigured ? '***' : 'NOT SET',
      },
      cursor: {
        file: '~/.cursor/mcp.json or ~/.cursor/extensions/mcp/config.json',
        setup_url: 'https://docs.cursor.com/context/model-context-protocol',
      },
      claude_desktop: {
        file: '~/Library/Application Support/Claude/claude_desktop_config.json (macOS)',
        file_win: '%APPDATA%\\Claude\\claude_desktop_config.json (Windows)',
        setup_url: 'https://modelcontextprotocol.io/quickstart/user#claude-desktop',
      },
      vscode_extension: {
        name: 'Continue',
        setup_url: 'https://continue.dev/docs/reference/Model%20Context%20Protocol',
      },
    },
    message: isConfigured
      ? 'Render MCP Server is configured and ready'
      : 'Set RENDER_API_KEY environment variable to enable',
  });
});

// Example prompts for AI apps
router.get('/examples', (_req: Request, res: Response) => {
  res.json({
    description: 'Example prompts for AI apps to manage Render infrastructure',
    examples: [
      {
        category: 'Service Management',
        prompts: [
          'List all my Render services',
          'Get details about my agentbot-api service',
          'Show recent deployments',
          'What services have been deployed in the last 24 hours?',
        ],
      },
      {
        category: 'Environment Variables',
        prompts: [
          'List environment variables for my API service',
          'Set OPENROUTER_API_KEY for the agentbot-api service',
          'Show which services have DATABASE_URL set',
        ],
      },
      {
        category: 'Databases',
        prompts: [
          'List all my Postgres databases',
          'Create a new database named user-db',
          'Show connection string for agentbot-db',
        ],
      },
      {
        category: 'Monitoring',
        prompts: [
          'Get recent logs for my web service',
          'Show all services and their current status',
          'Which service is consuming the most resources?',
        ],
      },
      {
        category: 'Troubleshooting',
        prompts: [
          'Why is my service not running?',
          'Show me the last 50 lines of logs',
          'What changed recently in my deployments?',
        ],
      },
    ],
  });
});

// Health check
router.get('/health', (_req: Request, res: Response) => {
  const isConfigured = !!RENDER_API_KEY;
  
  res.json({
    status: isConfigured ? 'healthy' : 'degraded',
    mcp_server: 'render',
    api_configured: isConfigured,
    message: isConfigured
      ? 'Render MCP Server is configured and ready'
      : 'RENDER_API_KEY environment variable is not set. Get it from https://dashboard.render.com/account/api-tokens',
    setup_docs: 'https://render.com/docs/api-reference',
  });
});

// MCP Protocol handler - routes requests to appropriate Render API calls
router.post('/mcp', async (req: Request, res: Response) => {
  const request = req.body as MCPRequest;
  const { method, params, id } = request;

  try {
    let result: unknown;

    // Route to Render API based on method
    switch (method) {
      case 'list_services':
        result = await callRenderAPI('GET', '/services');
        break;

      case 'get_service':
        if (!params?.service_id) throw new Error('service_id parameter required');
        result = await callRenderAPI('GET', `/services/${params.service_id}`);
        break;

      case 'list_deploys':
        if (!params?.service_id) throw new Error('service_id parameter required');
        result = await callRenderAPI('GET', `/services/${params.service_id}/deploys`);
        break;

      case 'get_deploy':
        if (!params?.deploy_id) throw new Error('deploy_id parameter required');
        result = await callRenderAPI('GET', `/deploys/${params.deploy_id}`);
        break;

      case 'list_postgres':
        result = await callRenderAPI('GET', '/postgres');
        break;

      case 'get_postgres':
        if (!params?.postgres_id) throw new Error('postgres_id parameter required');
        result = await callRenderAPI('GET', `/postgres/${params.postgres_id}`);
        break;

      case 'list_redis':
        result = await callRenderAPI('GET', '/redis');
        break;

      case 'get_redis':
        if (!params?.redis_id) throw new Error('redis_id parameter required');
        result = await callRenderAPI('GET', `/redis/${params.redis_id}`);
        break;

      case 'get_service_logs':
        if (!params?.service_id) throw new Error('service_id parameter required');
        const limit = params.limit || 100;
        result = await callRenderAPI('GET', `/services/${params.service_id}/logs?limit=${limit}`);
        break;

      case 'list_env_vars':
        if (!params?.service_id) throw new Error('service_id parameter required');
        result = await callRenderAPI('GET', `/services/${params.service_id}/env-vars`);
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    res.json({
      jsonrpc: '2.0',
      result,
      id,
    } as MCPResponse);
  } catch (error) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: error instanceof Error ? error.message : 'Invalid request',
      },
      id,
    } as MCPResponse);
  }
});

// Helper function to categorize tools
function getCategoryForTool(toolId: string): string {
  if (toolId.includes('service')) return 'Services';
  if (toolId.includes('deploy')) return 'Deployments';
  if (toolId.includes('env')) return 'Environment';
  if (toolId.includes('postgres')) return 'Databases';
  if (toolId.includes('redis')) return 'Cache';
  if (toolId.includes('log')) return 'Logging';
  return 'Other';
}

export default router;
