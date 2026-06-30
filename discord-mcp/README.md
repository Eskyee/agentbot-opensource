# Discord MCP server

Discord has no official hosted MCP server, so the agent's Discord connection
needs a self-hosted one. This deploys the open-source
[`barryy625/mcp-discord`](https://github.com/barryyip0625/mcp-discord) in
streamable-HTTP mode and exposes a `/mcp` endpoint.

> ⚠️ Third-party code with access to your Discord via the bot token. Review the
> upstream project before deploying.

## Deploy on Railway

1. New service → **Deploy from Repo** → set root to `discord-mcp/` (Dockerfile build), or
   **Deploy a Docker Image** → `barryy625/mcp-discord:latest` with start args
   `--transport http --port $PORT`.
2. Set the service variable:
   - `DISCORD_TOKEN` = your Discord bot token (Developer Portal → Bot → Reset Token)
3. Deploy. The MCP endpoint is `https://<service>YOUR_SERVICE_URL/mcp`.

## Wire it to the agent

1. In the Vercel Connect **discord.com/agentbot** connector, set **Server URL**
   to the deployed `https://<service>YOUR_SERVICE_URL/mcp`.
2. Add `agent/connections/discord.ts` pointing at that URL with
   `auth: connect('discord.com/agentbot')` — paste the URL to Claude and it will
   add the connection file.

## Bot setup notes

- The Discord **bot** must be invited to your server with the scopes/permissions
  it needs (the OAuth2 URL Generator in the Developer Portal creates the invite).
- The Vercel Connect connector's OAuth (client id/secret, redirect URI) handles
  per-user authorization; the bot token above is what the MCP server itself uses.
