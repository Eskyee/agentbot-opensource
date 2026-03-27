---
title: MCP Server
description: "Connect AI agents to Agentbot using the Model Context Protocol."
---

# MCP Server

Connect AI agents, IDEs, and tools to Agentbot using the Model Context Protocol (MCP). Query agents, manage deployments, and access the skills marketplace — all from your local environment.

## What MCP Gives You

MCP lets tools like Claude Desktop, Cursor, and custom agents talk to Agentbot as if it were a local tool. No REST calls, no manual auth headers — just natural language queries routed through the MCP server.

## Available Tools

| Tool | Description |
|------|-------------|
| `search_agentbot` | Search the Agentbot knowledge base for docs, code examples, and API references |
| `list_agents` | List all deployed agents and their status |
| `get_agent_health` | Check health, uptime, and resource usage for a specific agent |
| `deploy_agent` | Deploy a new agent from a skill template |
| `get_metrics` | Retrieve performance metrics and usage stats |
| `manage_skills` | List, install, or configure agent skills |

## Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentbot": {
      "command": "npx",
      "args": ["-y", "@agentbot/mcp-server"],
      "env": {
        "AGENTBOT_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agentbot": {
      "command": "npx",
      "args": ["-y", "@agentbot/mcp-server"],
      "env": {
        "AGENTBOT_API_KEY": "your-api-key"
      }
    }
  }
}
```

### VS Code (with Copilot)

Add to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "agentbot": {
      "command": "npx",
      "args": ["-y", "@agentbot/mcp-server"],
      "env": {
        "AGENTBOT_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Use Cases

### Query your agents from your IDE

Ask Claude or Cursor to check agent status without leaving your editor:

> "What's the health of my Telegram agent?"
> "Show me the last 10 errors from my Discord bot"
> "Deploy a new agent with the weather skill"

### Debug agent deployments

Use MCP to inspect live agents, check logs, and diagnose issues:

> "Why is my agent running out of memory?"
> "What skills are installed on my production agent?"
> "Show me the current token usage"

### Automate operations

Chain MCP tools with your existing CI/CD pipeline:

```bash
# Pre-deploy health check
npx @agentbot/mcp-server check-health --agent my-agent

# Deploy and verify
npx @agentbot/mcp-server deploy --skills weather,web-search --verify
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AGENTBOT_API_KEY` | Your Agentbot API key (required) |
| `AGENTBOT_BASE_URL` | Base URL (default: `https://api.agentbot.raveculture.xyz`) |
| `AGENTBOT_TIMEOUT` | Request timeout in ms (default: `30000`) |
| `AGENTBOT_DEBUG` | Enable debug logging (`true`/`false`) |

## Authentication

Generate an API key from the [Agentbot dashboard](https://agentbot.raveculture.xyz/dashboard/keys). The key grants read/write access to your agents and skills — keep it secure.

<Note>
MCP uses the same API key as the REST API. One key works across all integrations.
</Note>

## Troubleshooting

<AccordionGroup>

<Accordion icon="error" title="MCP server not starting">

- Ensure Node.js 18+ is installed: `node --version`
- Check that `AGENTBOT_API_KEY` is set in your config
- Try running `npx -y @agentbot/mcp-server --debug` for verbose output

</Accordion>

<Accordion icon="error" title="Connection timeout">

- Verify `AGENTBOT_BASE_URL` is correct (no trailing slash)
- Check your network allows outbound HTTPS to `*.raveculture.xyz`
- Increase timeout with `AGENTBOT_TIMEOUT=60000`

</Accordion>

<Accordion icon="error" title="Permission denied errors">

- Regenerate your API key from the dashboard
- Ensure the key hasn't expired
- Check your plan includes API access

</Accordion>

</AccordionGroup>
