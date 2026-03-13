# Render MCP Server Setup Guide

The AgentBot Render MCP Server allows AI apps (Cursor, Claude Code, VSCode extensions) to manage your Render infrastructure through natural language.

## Quick Start

### 1. Get Your Render API Key

1. Go to https://dashboard.render.com/account/api-tokens
2. Click "Create API Token"
3. Name it (e.g., "AgentBot MCP")
4. Copy the token (you'll only see it once)

### 2. Set Environment Variable

Set `RENDER_API_KEY` in your Render dashboard:

```bash
# In Render Dashboard -> agentbot-api service -> Environment
RENDER_API_KEY=your_token_here
```

Then restart the service.

### 3. Test the MCP Server

```bash
# Check if configured
curl https://agentbot-api.onrender.com/api/render-mcp/health

# List available tools
curl https://agentbot-api.onrender.com/api/render-mcp/tools

# View setup instructions
curl https://agentbot-api.onrender.com/api/render-mcp/config
```

---

## Configure in Your IDE

### Cursor

1. Open `~/.cursor/mcp.json` (create if doesn't exist)
2. Add this configuration:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://agentbot-api.onrender.com/api/render-mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer optional"
      }
    }
  }
}
```

3. Reload Cursor
4. Ask: "List my Render services"

### Claude Desktop

1. Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
2. Add:

```json
{
  "mcpServers": {
    "render": {
      "command": "npx",
      "args": ["mcp-remote", "https://agentbot-api.onrender.com/api/render-mcp"],
      "env": {
        "MCP_SERVER_URL": "https://agentbot-api.onrender.com/api/render-mcp"
      }
    }
  }
}
```

3. Restart Claude
4. Ask: "What services do I have on Render?"

### VSCode with Continue Extension

1. Install [Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) extension
2. Open `.continue/config.json` in your project
3. Add MCP server config:

```json
{
  "mcpServers": [
    {
      "name": "render",
      "url": "https://agentbot-api.onrender.com/api/render-mcp",
      "transport": "http"
    }
  ]
}
```

4. Reload VSCode
5. Use @render to reference Render tools

---

## Example Prompts

Once configured, try these prompts:

### Service Management
- "List all my Render services"
- "Show me the status of agentbot-api"
- "Get the deploy history for my main API"
- "Which services were deployed today?"

### Environment Variables
- "Set OPENROUTER_API_KEY to [key] for agentbot-api"
- "List environment variables for agentbot-api"
- "Show all services with DATABASE_URL set"

### Databases
- "List all my Postgres databases"
- "What's the connection string for agentbot-db?"
- "Create a new Redis cache instance"

### Monitoring & Troubleshooting
- "Get recent logs from agentbot-api"
- "Why is my web service not running?"
- "Show me what changed in the last 24 hours"
- "Which service is consuming the most memory?"

---

## Available MCP Tools

### Services
- `list_services` - List all services
- `get_service` - Get details for a specific service
- `create_service` - Deploy a new service
- `update_service` - Modify service configuration
- `delete_service` - Remove a service

### Deployments
- `list_deploys` - View deployment history
- `get_deploy` - Get deployment details
- `trigger_deploy` - Start a new deployment

### Environment Variables
- `list_env_vars` - List env vars for a service
- `set_env_var` - Set an environment variable
- `delete_env_var` - Remove an environment variable

### Databases
- `list_postgres` - List Postgres databases
- `create_postgres` - Create new database
- `get_postgres` - Get database details
- `list_redis` - List Redis instances
- `create_redis` - Create Redis cache
- `get_redis` - Get Redis details

### Logging & Monitoring
- `get_service_logs` - Fetch service logs
- `list_services` - Get all services with status

---

## How It Works

1. You write a natural language request in your IDE
2. AI app sends it to AgentBot's MCP endpoint
3. AgentBot routes the request to Render REST API
4. Response is returned and displayed in your IDE

## Troubleshooting

### "MCP Server not found"
- Check RENDER_API_KEY is set and service restarted
- Verify URL is `https://agentbot-api.onrender.com/api/render-mcp`

### "Render API error (401)"
- Your RENDER_API_KEY is invalid or expired
- Get a new token from https://dashboard.render.com/account/api-tokens

### "Unknown method"
- The tool isn't implemented yet
- Open an issue or request the feature

### IDE Not Connecting
- Restart the IDE completely
- Check firewall/network access to agentbot-api.onrender.com
- Verify HTTPS is working: `curl https://agentbot-api.onrender.com/api/render-mcp/health`

---

## Architecture

```
Cursor/Claude Code/VSCode
         ↓
    MCP Protocol
         ↓
AgentBot MCP Server (agentbot-api)
         ↓
   Render REST API
         ↓
Your Render Infrastructure
```

---

## Security Notes

- RENDER_API_KEY should be kept private (don't commit to repos)
- The MCP server validates all Render API requests
- Requests are rate-limited by Render API
- All communication uses HTTPS

---

## API Reference

### MCP Endpoint
```
https://agentbot-api.onrender.com/api/render-mcp
```

### Health Check
```bash
GET https://agentbot-api.onrender.com/api/render-mcp/health
```

### List Tools
```bash
GET https://agentbot-api.onrender.com/api/render-mcp/tools
```

### Configuration
```bash
GET https://agentbot-api.onrender.com/api/render-mcp/config
```

### MCP Protocol (POST)
```bash
POST https://agentbot-api.onrender.com/api/render-mcp/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "list_services",
  "params": {},
  "id": 1
}
```

---

## Next Steps

1. Set RENDER_API_KEY in Render dashboard
2. Configure your IDE (Cursor/Claude Desktop/VSCode)
3. Try the example prompts
4. Automate infrastructure management with natural language!
