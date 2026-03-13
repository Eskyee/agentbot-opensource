import { Router, Request, Response } from 'express';

/**
 * Render MCP Server Integration
 * Exposes Render infrastructure management through MCP protocol
 * Allows AI apps (Cursor, Claude Code, etc.) to manage Render resources
 */

const router = Router();

// MCP Server Configuration
const MCP_SERVER_URL = 'https://mcp.render.com/mcp';

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
 * MCP Tools exposed by Render
 * See: https://render.com/docs/mcp-server
 */
const AVAILABLE_TOOLS = {
  // Workspace tools
  list_workspaces: 'List all workspaces',
  set_workspace: 'Set current workspace',
  get_workspace: 'Fetch current workspace details',

  // Service tools
  create_service: 'Create new service (web, static, cron, db)',
  list_services: 'List all services in workspace',
  get_service: 'Get service details',
  update_service_env: 'Update service environment variables',

  // Deployment tools
  list_deploys: 'List deploy history for service',
  get_deploy: 'Get deploy details',

  // Logging tools
  list_logs: 'List logs with filters',
  list_log_labels: 'Get log label values',

  // Metrics tools
  get_metrics: 'Fetch performance metrics (CPU, memory, bandwidth)',

  // Database tools
  create_postgres: 'Create Render Postgres database',
  list_postgres: 'List all databases',
  get_postgres: 'Get database details',
  query_postgres: 'Run read-only SQL query',

  // Key-Value tools
  create_keyvalue: 'Create Redis Key-Value instance',
  list_keyvalue: 'List Key-Value instances',
  get_keyvalue: 'Get Key-Value instance details',
};

// MCP Server endpoints
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    name: 'Render MCP Server',
    version: '1.0.0',
    documentation: 'https://render.com/docs/mcp-server',
    mcp_endpoint: MCP_SERVER_URL,
    tools: AVAILABLE_TOOLS,
  });
});

// MCP Protocol handler
router.post('/mcp', async (req: Request, res: Response) => {
  const request = req.body as MCPRequest;

  try {
    // Forward to Render MCP server
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RENDER_API_KEY || ''}`,
      },
      body: JSON.stringify(request),
    });

    const data = (await response.json()) as MCPResponse;
    res.json(data);
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
      },
      id: request.id,
    });
  }
});

// Tool reference endpoint
router.get('/tools', (_req: Request, res: Response) => {
  res.json({
    description: 'MCP Tools for managing Render infrastructure',
    tools: Object.entries(AVAILABLE_TOOLS).map(([id, description]) => ({
      id,
      description,
      category: getCategoryForTool(id),
    })),
    setup_guide: 'https://render.com/docs/mcp-server#setup',
  });
});

// Configuration instructions endpoint
router.get('/config', (_req: Request, res: Response) => {
  const apiKey = process.env.RENDER_API_KEY ? '***' : 'NOT SET';
  
  res.json({
    status: 'configured' as const,
    mcp_endpoint: MCP_SERVER_URL,
    api_key_set: !!process.env.RENDER_API_KEY,
    instructions: {
      cursor: {
        config_file: '~/.cursor/mcp.json',
        format: {
          mcpServers: {
            render: {
              url: MCP_SERVER_URL,
              headers: {
                Authorization: 'Bearer YOUR_API_KEY',
              },
            },
          },
        },
      },
      claude_code: {
        command: `claude mcp add --transport http render ${MCP_SERVER_URL} --header "Authorization: Bearer YOUR_API_KEY"`,
      },
      claude_desktop: {
        config_file: '~/Library/Application Support/Claude/claude_desktop_config.json',
        format: {
          mcpServers: {
            render: {
              command: 'npx',
              args: ['mcp-remote', MCP_SERVER_URL, '--header', 'Authorization: Bearer YOUR_API_KEY'],
              env: {
                RENDER_API_KEY: 'YOUR_API_KEY',
              },
            },
          },
        },
      },
      windsurf: {
        config_file: '~/.codeium/windsurf/mcp_config.json',
        format: {
          mcpServers: {
            render: {
              url: MCP_SERVER_URL,
              headers: {
                Authorization: 'Bearer YOUR_API_KEY',
              },
            },
          },
        },
      },
    },
  });
});

// Example prompts endpoint
router.get('/examples', (_req: Request, res: Response) => {
  res.json({
    examples: [
      {
        category: 'Service Management',
        prompts: [
          'List my Render services',
          'Create a new web service from https://github.com/render-examples/flask-hello-world',
          'Deploy an example Postgres database named user-db with 5 GB storage',
          'Update environment variables for my API service',
        ],
      },
      {
        category: 'Monitoring',
        prompts: [
          'What was the busiest traffic day for my service this month?',
          'Show me CPU and memory usage for all services',
          'Pull the most recent error-level logs for my API',
        ],
      },
      {
        category: 'Data Management',
        prompts: [
          'Query my Render Postgres database for user counts',
          'Create a new Redis Key-Value instance for caching',
          'What did my service autoscaling look like yesterday?',
        ],
      },
      {
        category: 'Troubleshooting',
        prompts: [
          'Why isn\'t my site at example.onrender.com working?',
          'Show me recent deployment history',
          'Check outbound bandwidth usage for this month',
        ],
      },
    ],
  });
});

// Health check
router.get('/health', (_req: Request, res: Response) => {
  const isConfigured = !!process.env.RENDER_API_KEY;
  
  res.json({
    status: isConfigured ? 'healthy' : 'degraded',
    mcp_server_url: MCP_SERVER_URL,
    api_key_configured: isConfigured,
    message: isConfigured
      ? 'Render MCP Server is configured and ready'
      : 'RENDER_API_KEY environment variable not set',
  });
});

// Helper function to categorize tools
function getCategoryForTool(toolId: string): string {
  if (toolId.includes('workspace')) return 'Workspaces';
  if (toolId.includes('service')) return 'Services';
  if (toolId.includes('deploy')) return 'Deployments';
  if (toolId.includes('log')) return 'Logging';
  if (toolId.includes('metric')) return 'Metrics';
  if (toolId.includes('postgres')) return 'Databases';
  if (toolId.includes('keyvalue')) return 'Key-Value Storage';
  return 'Other';
}

export default router;
