# Render MCP Server

MCP server for managing Render cloud infrastructure — services, deploys, databases, Redis, logs, environment variables, and custom domains.

## Setup

### 1. Get your Render API key

Go to https://dashboard.render.com/u/settings#api-keys and create a new API key.

### 2. Install dependencies

```bash
cd render-mcp-server
npm install
npm run build
```

### 3. Configure Claude Code / Cowork

Add to your MCP config (`.claude/mcp.json` or Claude Code settings):

```json
{
  "mcpServers": {
    "render": {
      "command": "node",
      "args": ["/path/to/render-mcp-server/dist/index.js"],
      "env": {
        "RENDER_API_KEY": "rnd_your_api_key_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `render_list_services` | List all services with filtering |
| `render_get_service` | Get detailed service info |
| `render_update_service` | Update service config |
| `render_restart_service` | Restart a service |
| `render_scale_service` | Scale instance count |
| `render_suspend_service` | Suspend a service |
| `render_resume_service` | Resume a service |
| `render_delete_service` | Delete a service |
| `render_list_deploys` | List deploy history |
| `render_trigger_deploy` | Trigger a new deploy |
| `render_get_deploy` | Get deploy details |
| `render_cancel_deploy` | Cancel in-progress deploy |
| `render_list_postgres` | List PostgreSQL databases |
| `render_get_postgres` | Get database details + connection strings |
| `render_list_redis` | List Redis instances |
| `render_get_logs` | Get service/database logs |
| `render_list_env_vars` | List environment variables |
| `render_set_env_var` | Set an environment variable |
| `render_delete_env_var` | Delete an environment variable |
| `render_list_custom_domains` | List custom domains |
| `render_list_projects` | List all projects |
| `render_get_project` | Get project details |
| `render_list_environments` | List project environments |
| `render_get_environment` | Get environment details |
| `render_list_instances` | List service instances |
| `render_list_env_groups` | List environment groups |
| `render_create_env_group` | Create environment group |
| `render_update_env_group` | Update environment group |
| `render_delete_env_group` | Delete environment group |

## Requirements

- Node.js >= 18
- `RENDER_API_KEY` environment variable
