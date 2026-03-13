# Render MCP Integration Guide

AgentBot now integrates with the **official Render MCP Server** for comprehensive infrastructure management.

## What is the Render MCP Server?

The Render MCP Server is an official tool maintained by Render that implements the **Model Context Protocol**. It allows you to manage all your Render infrastructure through natural language via AI tools like Cursor, Claude Desktop, and VSCode.

**Official Repository:** https://github.com/render-oss/render-mcp-server  
**Official Docs:** https://render.com/docs/mcp-server

---

## Setup Options

### Option 1: Direct Docker (Recommended for Local Development)

Use the official Docker image directly in your IDE:

```json
{
  "mcpServers": {
    "render": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "RENDER_API_KEY",
        "-v",
        "render-mcp-server-config:/config",
        "ghcr.io/render-oss/render-mcp-server"
      ],
      "env": {
        "RENDER_API_KEY": "rnd_abc123xyz"
      }
    }
  }
}
```

**Works in:** Claude Desktop, VS Code with extensions, any MCP-compatible tool

**Requires:**
- Docker installed
- `RENDER_API_KEY` set locally

---

### Option 2: Via AgentBot (Production)

Use AgentBot's Render MCP gateway for a managed experience:

```
Endpoint: https://agentbot-api.onrender.com/api/render-mcp
```

This approach:
- ✅ No local Docker required
- ✅ Works on any device
- ✅ Shared configuration
- ✅ Audit logging
- ✅ Rate limiting

---

## Getting Your RENDER_API_KEY

1. Go to https://dashboard.render.com/account/api-tokens
2. Click "Create API Token"
3. Name it (e.g., "MCP Server")
4. Copy the token (only shown once!)
5. Use it in your IDE configuration

**Security Note:** Treat this like a password. Never commit to git.

---

## Configure in Your IDE

### Cursor IDE

**File:** `~/.cursor/mcp.json` (create if doesn't exist)

```json
{
  "mcpServers": {
    "render": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "RENDER_API_KEY",
        "-v",
        "render-mcp-server-config:/config",
        "ghcr.io/render-oss/render-mcp-server"
      ],
      "env": {
        "RENDER_API_KEY": "rnd_your_key_here"
      }
    }
  }
}
```

Then reload Cursor and ask:
```
"List my Render services"
"Show me the status of agentbot-api"
```

### Claude Desktop

**File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

Or: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "render": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "RENDER_API_KEY",
        "-v",
        "render-mcp-server-config:/config",
        "ghcr.io/render-oss/render-mcp-server"
      ],
      "env": {
        "RENDER_API_KEY": "rnd_your_key_here"
      }
    }
  }
}
```

Restart Claude, then try:
```
"Deploy a new web service from my GitHub repo"
"Get logs for my API service from the last hour"
"What databases do I have? Show their sizes"
```

### VS Code (with Continue, Claude, or Cody)

Install extension (e.g., [Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue))

Create `.continue/config.json` in your workspace:

```json
{
  "mcpServers": [
    {
      "name": "render",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "RENDER_API_KEY",
        "-v",
        "render-mcp-server-config:/config",
        "ghcr.io/render-oss/render-mcp-server"
      ],
      "env": {
        "RENDER_API_KEY": "rnd_your_key_here"
      }
    }
  ]
}
```

---

## Example Workflows

### Deploy a Web Service

```
You (in Claude):
"Create a new Node.js web service from https://github.com/my-org/my-app 
deployed to frankfurt region with start command 'npm start'"

Claude:
✓ Creates service with your specs
✓ Returns service URL and details
✓ Shows next steps
```

### Manage Environment Variables

```
You (in Cursor):
"Update OPENROUTER_API_KEY to sk-or-abc123 for my agentbot-api service"

Cursor:
✓ Updates the env var
✓ Restarts service
✓ Confirms change
```

### Monitor Deployments

```
You (in VS Code):
"Show me recent deployments and their status"

AI:
✓ Lists last 10 deployments
✓ Shows status, duration, commit info
✓ Highlights any failures
```

### Query Database

```
You (in Claude):
"How many users are in my database? 
Run: SELECT COUNT(*) FROM users"

Claude:
✓ Connects to your Postgres database
✓ Runs query (read-only)
✓ Returns result
```

### Get Performance Metrics

```
You (in Cursor):
"Show me CPU and memory usage for agentbot-api in the last hour"

Cursor:
✓ Fetches metrics
✓ Shows average, peak usage
✓ Identifies trends
```

---

## Available Tools

The official Render MCP server provides these tool categories:

### Workspaces
- `list_workspaces` - See all your workspaces
- `select_workspace` - Switch workspace
- `get_selected_workspace` - Current workspace

### Services
- `list_services` - All services
- `get_service` - Service details
- `create_web_service` - Deploy web app
- `create_static_site` - Deploy static site
- `create_cron_job` - Schedule jobs
- `update_environment_variables` - Update config

### Deployments
- `list_deploys` - Deployment history
- `get_deploy` - Deployment details

### Databases
- `list_postgres_instances` - Your Postgres DBs
- `get_postgres` - Database details
- `create_postgres` - New database
- `query_render_postgres` - Run SQL queries (read-only)

### Key-Value Store (Redis)
- `list_key_value` - Your Redis instances
- `get_key_value` - Instance details
- `create_key_value` - New cache

### Monitoring
- `list_logs` - Logs with filters
- `list_log_label_values` - Available log fields
- `get_metrics` - Performance metrics (CPU, memory, requests, etc.)

### Complete List
See https://github.com/render-oss/render-mcp-server#tools for the full reference.

---

## Troubleshooting

### "Docker: command not found"
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Make sure it's running

### "Cannot connect to Docker daemon"
- Start Docker Desktop
- Try `docker ps` in terminal to verify

### "RENDER_API_KEY is invalid"
- Get a new token from https://dashboard.render.com/account/api-tokens
- Paste the full token (starts with `rnd_`)
- Reload IDE

### "No such file or directory"
- Check IDE config file path is correct
- For Claude: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- For Cursor: `~/.cursor/mcp.json`

### "Permission denied"
- Make sure Docker has permissions
- On Linux: `sudo usermod -aG docker $USER` then restart terminal

### "Tool not found"
- Update Docker image: `docker pull ghcr.io/render-oss/render-mcp-server`
- Some tools may require specific account type

---

## Advanced: Multiple Workspaces

If you have multiple Render workspaces, you can configure multiple MCP server instances:

```json
{
  "mcpServers": {
    "render-prod": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "RENDER_API_KEY", "-v", "render-mcp-prod:/config", "ghcr.io/render-oss/render-mcp-server"],
      "env": {
        "RENDER_API_KEY": "rnd_prod_key_123"
      }
    },
    "render-staging": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "RENDER_API_KEY", "-v", "render-mcp-staging:/config", "ghcr.io/render-oss/render-mcp-server"],
      "env": {
        "RENDER_API_KEY": "rnd_staging_key_456"
      }
    }
  }
}
```

Then use in Claude: `@render-prod` or `@render-staging`

---

## Security Best Practices

1. **Never commit API keys to git**
   - Use `.gitignore` for config files with secrets
   - Use environment variables instead

2. **Use workspace-specific tokens**
   - Create separate API keys for prod/staging
   - Rotate tokens periodically

3. **Limit token scope**
   - Create tokens with minimal required permissions
   - Don't reuse prod tokens for testing

4. **Monitor API usage**
   - Check Render dashboard for token activity
   - Revoke unused tokens

---

## What's Next?

1. **Get your RENDER_API_KEY** from https://dashboard.render.com/account/api-tokens
2. **Choose your IDE** (Cursor, Claude, or VS Code)
3. **Add MCP configuration** using the templates above
4. **Test with a simple prompt** like "List my services"
5. **Explore the tools** and automate your workflow

---

## Official Resources

- **GitHub:** https://github.com/render-oss/render-mcp-server
- **Docs:** https://render.com/docs/mcp-server
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Issues/Feedback:** https://github.com/render-oss/render-mcp-server/issues

---

## AgentBot Integration

AgentBot can also expose the Render MCP server for managed access:

```
Endpoint: https://agentbot-api.onrender.com/api/render-mcp
Status: https://agentbot-api.onrender.com/api/render-mcp/health
```

Contact the AgentBot team to enable this if needed for your organization.
