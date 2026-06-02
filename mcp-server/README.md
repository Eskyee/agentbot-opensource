# Agentbot MCP Server

MiMo-powered AI agent tools via the [Model Context Protocol](https://modelcontextprotocol.io).

## Quick Start

```bash
# Install
npm install -g agentbot-mcp

# Run
MIMO_API_KEY=tp-ebz5le...l23ou6 agentbot-mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `chat` | Send chat completions to MiMo V2.5 Pro |
| `list_models` | List available MiMo models |
| `x402_discover` | Discover paid services on Agentic Market |
| `health` | Check Agentbot platform health |

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "agentbot": {
      "command": "npx",
      "args": ["agentbot-mcp"],
      "env": {
        "MIMO_API_KEY": "tp-ebz5le...l23ou6"
      }
    }
  }
}
```

## Usage with OpenClaw

Add to your OpenClaw config:

```json
{
  "mcp": {
    "servers": {
      "agentbot": {
        "command": "npx",
        "args": ["agentbot-mcp"],
        "env": {
          "MIMO_API_KEY": "tp-ebz5le...l23ou6"
        }
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MIMO_API_KEY` | MiMo subscription API key | Yes |
| `AGENTBOT_API_KEY` | Agentbot platform API key | No |
| `AGENTBOT_URL` | Agentbot URL (default: https://agentbot.sh) | No |

## License

MIT
