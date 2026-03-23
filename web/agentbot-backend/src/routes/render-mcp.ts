import { Router, Request, Response } from 'express';

/**
 * Render MCP Server Gateway
 * 
 * This gateway provides information about the official Render MCP Server
 * and can optionally proxy requests to an instance if configured.
 * 
 * Most users should use the official Docker image directly:
 * https://github.com/render-oss/render-mcp-server
 * 
 * Docker Image: ghcr.io/render-oss/render-mcp-server
 * GitHub: https://github.com/render-oss/render-mcp-server
 * Docs: https://render.com/docs/mcp-server
 */

const router = Router();

interface MCPInfo {
  name: string;
  version: string;
  description: string;
  status: string;
  official_repo: string;
  docker_image: string;
  documentation: string;
}

// Health check
router.get('/health', (_req: Request, res: Response) => {
  const info: MCPInfo = {
    name: 'Render MCP Server Gateway',
    version: '1.0.0',
    description: 'Gateway for the official Render MCP Server',
    status: 'operational',
    official_repo: 'https://github.com/render-oss/render-mcp-server',
    docker_image: 'ghcr.io/render-oss/render-mcp-server',
    documentation: 'https://render.com/docs/mcp-server',
  };

  res.json({
    ...info,
    timestamp: new Date().toISOString(),
  });
});

// Server info
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    name: 'Render MCP Server',
    version: 'latest',
    description: 'Model Context Protocol server for managing Render infrastructure',
    maintained_by: 'Render',
    repository: 'https://github.com/render-oss/render-mcp-server',
    docker_image: 'ghcr.io/render-oss/render-mcp-server',
    documentation: 'https://render.com/docs/mcp-server',
    setup_guide: '/RENDER_MCP_SETUP_GUIDE.md in this repository',
    features: [
      'Service management (web, static, cron, worker)',
      'Environment variable management',
      'Deployment history and monitoring',
      'Database management (Postgres)',
      'Key-Value store management (Redis)',
      'Logs and metrics',
      'SQL query execution (read-only)',
    ],
  });
});

// Setup instructions
router.get('/setup', (_req: Request, res: Response) => {
  res.json({
    title: 'Render MCP Server Setup',
    recommended_approach: 'Use the official Docker image directly',
    quick_start: {
      step_1: 'Get RENDER_API_KEY from https://dashboard.render.com/account/api-tokens',
      step_2: 'Configure your IDE (Cursor, Claude Desktop, VS Code)',
      step_3: 'Use Docker configuration provided in setup guide',
    },
    docker_config_example: {
      mcpServers: {
        render: {
          command: 'docker',
          args: [
            'run',
            '-i',
            '--rm',
            '-e',
            'RENDER_API_KEY',
            '-v',
            'render-mcp-server-config:/config',
            'ghcr.io/render-oss/render-mcp-server',
          ],
          env: {
            RENDER_API_KEY: 'rnd_your_api_key_here',
          },
        },
      },
    },
    documentation_links: {
      official_setup: 'https://render.com/docs/mcp-server',
      github: 'https://github.com/render-oss/render-mcp-server',
      mcp_protocol: 'https://modelcontextprotocol.io/',
      agentbot_guide: 'See RENDER_MCP_SETUP_GUIDE.md',
    },
  });
});

// List all available tools (informational)
router.get('/tools', (_req: Request, res: Response) => {
  res.json({
    source: 'https://github.com/render-oss/render-mcp-server',
    tool_categories: {
      workspaces: [
        'list_workspaces',
        'select_workspace',
        'get_selected_workspace',
      ],
      services: [
        'list_services',
        'get_service',
        'create_web_service',
        'create_static_site',
        'create_cron_job',
        'update_environment_variables',
      ],
      deployments: [
        'list_deploys',
        'get_deploy',
      ],
      logs: [
        'list_logs',
        'list_log_label_values',
      ],
      metrics: [
        'get_metrics',
      ],
      postgres: [
        'list_postgres_instances',
        'get_postgres',
        'create_postgres',
        'query_render_postgres',
      ],
      key_value: [
        'list_key_value',
        'get_key_value',
        'create_key_value',
      ],
    },
    complete_reference: 'https://github.com/render-oss/render-mcp-server#tools',
  });
});

// Example workflows
router.get('/examples', (_req: Request, res: Response) => {
  res.json({
    description: 'Example prompts for the Render MCP Server',
    examples: {
      service_management: [
        'List all my Render services',
        'Get details about my agentbot-api service',
        'Create a new Node.js web service from my GitHub repo',
        'Update environment variables for my API service',
      ],
      deployment_monitoring: [
        'Show me deployment history for my main service',
        'What was deployed today?',
        'Get details about the last deployment',
        'Which services have failed deployments?',
      ],
      database_management: [
        'List all my Postgres databases',
        'Create a new Postgres database named cache-db',
        'Query my database: SELECT COUNT(*) FROM users',
        'Show database details and connection string',
      ],
      monitoring_and_logs: [
        'Get recent logs from my API service',
        'Show me error logs from the last hour',
        'What is the CPU usage for my service?',
        'Display HTTP request metrics and latency',
      ],
      troubleshooting: [
        'Why is my service not running?',
        'Show me all services and their current status',
        'Get logs for failed deployments',
        'What is the memory usage trend?',
      ],
    },
  });
});

// Documentation redirect
router.get('/docs', (_req: Request, res: Response) => {
  res.redirect(301, 'https://render.com/docs/mcp-server');
});

// GitHub redirect
router.get('/github', (_req: Request, res: Response) => {
  res.redirect(301, 'https://github.com/render-oss/render-mcp-server');
});

// Configuration validation endpoint
router.post('/validate-config', (req: Request, res: Response) => {
  const { api_key, endpoint } = req.body as { api_key?: string; endpoint?: string };

  // Basic validation
  if (!api_key) {
    return res.status(400).json({
      valid: false,
      errors: ['api_key is required'],
      help: 'Get your API key from https://dashboard.render.com/account/api-tokens',
    });
  }

  if (!api_key.startsWith('rnd_')) {
    return res.status(400).json({
      valid: false,
      errors: ['api_key must start with rnd_'],
      help: 'Check that you copied the full token from the dashboard',
    });
  }

  if (api_key.length < 20) {
    return res.status(400).json({
      valid: false,
      errors: ['api_key appears too short'],
      help: 'API keys are typically 40+ characters',
    });
  }

  res.json({
    valid: true,
    message: 'Configuration looks valid',
    next_steps: [
      'Add this key to your IDE MCP configuration',
      'Reload your IDE',
      'Test with: "List my Render services"',
    ],
  });
});

export default router;
