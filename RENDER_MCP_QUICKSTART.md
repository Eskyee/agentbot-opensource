# Quick Start: Render MCP + AgentBot

## 30-Second Setup

1. **Get API Key**
   ```bash
   # https://dashboard.render.com/account/api-tokens
   # Copy the token (starts with rnd_)
   ```

2. **Pick Your IDE Config**

   **Cursor (~/.cursor/mcp.json):**
   ```json
   {
     "mcpServers": {
       "render": {
         "command": "docker",
         "args": ["run", "-i", "--rm", "-e", "RENDER_API_KEY", "-v", "render-mcp-server-config:/config", "ghcr.io/render-oss/render-mcp-server"],
         "env": {"RENDER_API_KEY": "rnd_your_key_here"}
       }
     }
   }
   ```

   **Claude Desktop (~/ Library/Application Support/Claude/claude_desktop_config.json):**
   ```json
   {
     "mcpServers": {
       "render": {
         "command": "docker",
         "args": ["run", "-i", "--rm", "-e", "RENDER_API_KEY", "-v", "render-mcp-server-config:/config", "ghcr.io/render-oss/render-mcp-server"],
         "env": {"RENDER_API_KEY": "rnd_your_key_here"}
       }
     }
   }
   ```

   **VS Code (.continue/config.json):**
   ```json
   {
     "mcpServers": [
       {
         "name": "render",
         "command": "docker",
         "args": ["run", "-i", "--rm", "-e", "RENDER_API_KEY", "-v", "render-mcp-server-config:/config", "ghcr.io/render-oss/render-mcp-server"],
         "env": {"RENDER_API_KEY": "rnd_your_key_here"}
       }
     ]
   }
   ```

3. **Reload IDE & Test**
   ```
   "List my Render services"
   "Show logs for agentbot-api"
   ```

---

## Commands

### Services
```
List all services
Show details for agentbot-api
Create web service from https://github.com/my-repo/my-app
Update OPENROUTER_API_KEY to sk-or-... for agentbot-api
```

### Databases
```
List my Postgres databases
Create Postgres database named app-db
Query my database: SELECT COUNT(*) FROM users
```

### Redis
```
List my Redis instances
Create Redis cache named session-store
```

### Monitoring
```
Show recent deployments
Get logs from agentbot-api
CPU and memory usage for agentbot-api
```

### Cron Jobs
```
Create cron job "my-task" schedule "0 3 * * *" runtime python
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Docker: command not found" | Install Docker Desktop |
| "RENDER_API_KEY invalid" | Get new key from dashboard |
| "Cannot connect" | Start Docker Desktop |
| "Tool not found" | Run `docker pull ghcr.io/render-oss/render-mcp-server` |

---

## What's Working

✅ AgentBot Backend live at https://agentbot-api.onrender.com  
✅ AI Provider endpoints (`/api/ai/*`)  
✅ Universal models (Ollama + OpenRouter)  
✅ MCP info gateway (`/api/render-mcp/*`)  
✅ Official Render MCP Server docs & setup  

---

## Next

1. Get RENDER_API_KEY (1 min)
2. Update IDE config (2 min)
3. Reload IDE & test (1 min)
4. Start managing infrastructure with AI! 🚀

**Full Guide:** See `RENDER_MCP_SETUP_GUIDE.md`
