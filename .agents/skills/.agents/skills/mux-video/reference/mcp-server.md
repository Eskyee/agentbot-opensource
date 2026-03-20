# MCP Server for AI Tools

The Mux MCP (Model Context Protocol) Server brings Mux's Video and Data platform capabilities directly to your AI tools. Once set up, you can upload videos, manage live streams, analyze video performance, and access practically all of Mux's video infrastructure through natural language prompts in supported AI clients.

## Tools and Routes

The Mux MCP Server supports the following tools and API routes:

**Supported:**
- **Video API**: Create assets, uploads, live streams, playback URLs
- **Data API**: Query metrics, dimensions, real-time data
- **Webhook management**: List and verify webhook signatures
- **Asset management**: Retrieve, update video metadata
- **Live streaming**: Create streams, manage recordings
- **Analytics**: Performance metrics, viewer data, error tracking

**Not Supported (disabled for safety):**
- Asset deletion endpoints
- Live stream deletion endpoints
- Webhook deletion endpoints

## Prompt Examples

### Video Management

- Using the Mux tool, create a webpage where I can upload a video to Mux
- Give me the playback URL for the most recently uploaded video to my Mux account, use Mux MCP
- List all my video assets and their current status (using the Mux MCP tool)
- With the Mux tool: Show me recent video uploads
- Using Mux MCP, generate a subtitles track for asset ID: `ASSET_ID`

### Mux Data Analytics and Performance

- Using the Mux MCP, tell me the best performing country for video streaming over the last month
- Show me video performance metrics for the last week using the Mux tool
- With the Mux tool: what are the top performing videos by view count?
- Using Mux, which countries have the highest video engagement?
- What are the most common video errors in my account (use the Mux MCP)?
- Show me breakdown values for video quality metrics using the Mux MCP tool
- List all available data dimensions I can filter by, use the Mux MCP to answer this prompt

## Remote MCP Server Configuration

Mux's MCP server is hosted at `https://mcp.mux.com`. When using this remote MCP server, authentication is handled automatically with no need for grabbing Access Token information from the Dashboard.

### Setup Steps

1. Add an MCP server in your client (called "connector" in Claude/Claude Code/ChatGPT, "extension" in Goose, or "MCP Server" in VSCode)
2. Enter the URL `https://mcp.mux.com` as the location
3. The LLM client and MCP server will negotiate authentication automatically, prompting you to:
   - Log in to https://dashboard.mux.com (skipped if already logged in)
   - Choose which environment you want to authorize

### Configuration Options

By default, `https://mcp.mux.com` exposes access to the full set of tools available. You can customize behavior using query parameters:

| Parameter | Options | Description |
|-----------|---------|-------------|
| `tools` | `all` (default), `dynamic` | Use `dynamic` to allow LLMs to dynamically discover endpoints and tools, which can aid in controlling context windows and speeding up processing |
| `resource` | `video.*`, `data.*`, `system.*`, `video.asset.*`, etc. | Array of resources (sets of APIs) to expose. Acts as an inclusion set, so you can chain multiple to expand the list of tools |
| `client` | `claude` (default), `claude-code`, `cursor`, `openai-agents` | Each LLM has varying support for capabilities related to complex JSON schemas |

**Example:** To configure an MCP server that exposes only the Video APIs dynamically for Cursor:
```
https://mcp.mux.com?client=cursor&resource=video.*&tools=dynamic
```

## Local Installation

For clients without remote MCP support, you can install the MCP server locally.

### Prerequisites

- Node.js installed locally (instructions at https://nodejs.org/en/download)
- A Mux account
- Mux API access token and secret key from the Mux Dashboard (Settings > Access Tokens)
- Claude Desktop, Cursor, VSCode, or any client that supports local MCP servers

### Getting Mux API Credentials

1. Log into your Mux Dashboard
2. Navigate to Settings > Access Tokens
3. Generate a new access token or use an existing one
4. Copy your **Access Token ID** and **Secret Key**

**Required Scopes:** Your Mux access token should be configured for your desired Environment and read/write access. We recommend clearly labeling this access token (e.g., `MCP Access Token`).

### Claude Desktop Configuration

Claude supports the Desktop Extensions format. You can download the DXT file from GitHub (https://github.com/muxinc/mux-node-sdk/releases/download/v12.1.0/mux-mcp.dxt) and open it with Claude Desktop to install it.

For manual configuration:

**Configuration file location:**

macOS/Linux:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Windows:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Add this configuration:**

```json
{
  "globalShortcut": "",
  "mcpServers": {
    "mux": {
      "command": "npx",
      "args": ["-y", "@mux/mcp@latest","--tools=dynamic","--client=claude"],
      "env": {
        "MUX_TOKEN_ID": "your_access_token_id",
        "MUX_TOKEN_SECRET": "your_secret_key"
      }
    }
  }
}
```

Restart Claude Desktop to load the new configuration.

### Cursor Configuration

**Configuration file location:**

macOS/Linux:
```
~/.cursor/mcp.json
```

Windows:
```
C:/Users/<username>/.cursor/mcp.json
```

**Add this configuration:**

```json
{
  "mcpServers": {
    "mux": {
      "command": "npx",
      "args": ["-y", "@mux/mcp@latest","--tools=dynamic","--client=cursor"],
      "env": {
        "MUX_TOKEN_ID": "your_access_token_id",
        "MUX_TOKEN_SECRET": "your_secret_key"
      }
    }
  }
}
```

### VSCode Configuration

To add the server globally to all workspaces, add the configuration to your `settings.json` file.

**Configuration file location:**

macOS:
```
~/Library/Application Support/Code/User/settings.json
```

Linux:
```
~/.config/Code/User/settings.json
```

Windows:
```
%APPDATA%\Code\User\settings.json
```

**Add this configuration:**

```json
{
  "mcp": {
    "servers": {
      "mux": {
        "command": "npx",
        "args": ["-y", "@mux/mcp@latest","--tools=dynamic"],
        "env": {
          "MUX_TOKEN_ID": "your_access_token_id",
          "MUX_TOKEN_SECRET": "your_secret_key"
        }
      }
    }
  }
}
```

In VSCode, click the `Start` button in the MCP Server to start it. You can do this from the settings file or from the Command Palette with `MCP: List Servers`.

### Using Node Version Managers (Mise)

If you use a tool like Mise to manage Node versions, execute npx commands from within that context:

```
mise x node@20 -- npx -y @mux/mcp@latest
```

Configuration example:

```json
"command": "mise",
"args": ["x", "node@20", "--", "npx", "-y", "@mux/mcp@latest","--tools=dynamic","--client=claude"],
```

## Using mcp-remote

For clients without built-in remote MCP support, you can use [mcp-remote](https://www.npmjs.com/package/mcp-remote) to bring remote MCP server support to practically any LLM client. This may also perform better than built-in remote MCP support depending on the client.

## Verifying Installation

Test that the Mux MCP Server is working by asking your AI client:

> Give me the details for the most recently created Mux Video asset (using the Mux tool)

or

> Using the Mux MCP, list the best performing countries for video streaming over the last month using Mux Data

If successful, the AI will connect to the Mux API through the MCP server and return information about your video performance or assets.

## Troubleshooting

### Build Issues

- Make sure you have the correct Node.js version installed
- Verify npx is accessible in your PATH (`npx -v`)

### Connection Issues

- Double-check that your file path in the `args` field is correct
- Verify your Mux credentials are correct and properly formatted
- Make sure there are no extra spaces or characters in your token values
- Confirm your API tokens have the necessary permissions in your Mux account

### Claude Desktop Issues

- Ensure you're using the latest version of Claude Desktop (older versions may not support MCP)
- Verify your JSON configuration is valid (no missing commas or brackets)
- Check that Claude Desktop has restarted completely after configuration changes

## Resources

- Model Context Protocol documentation: https://modelcontextprotocol.io/quickstart/user
- Claude MCP documentation: https://docs.anthropic.com/en/docs/agents-and-tools/mcp
- Mux API reference: https://docs.mux.com/api-reference
- Mux support: https://mux.com/support
