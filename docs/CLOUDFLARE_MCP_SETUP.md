# Cloudflare MCP + Auto-Config Setup

This guide sets up:
- Cloudflare MCP server (for AI-assisted Cloudflare actions)
- Automated DNS configuration for production hosts

## 1) Create Cloudflare API token

In Cloudflare, create a token with:
- Zone:DNS:Edit
- Zone:Zone:Read
- Scope limited to your production zone

Save:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`

## 2) MCP server config

Install/run package:
- `@cloudflare/mcp-server-cloudflare`

Example MCP config:

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@cloudflare/mcp-server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}"
      }
    }
  }
}
```

Set env in your shell profile:

```bash
export CLOUDFLARE_API_TOKEN="<your-token>"
export CLOUDFLARE_ZONE_ID="<your-zone-id>"
```

## 3) Automated DNS config

Run with your server IP:

```bash
CF_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
CF_ZONE_ID="$CLOUDFLARE_ZONE_ID" \
SERVER_IP="<your-server-ip>" \
make cloudflare-autoconfig
```

Default records created/updated:
- `CNAME agentbot.raveculture.xyz -> cname.vercel-dns.com` (proxied)
- `CNAME www.agentbot.raveculture.xyz -> cname.vercel-dns.com` (proxied)
- `A api.agentbot.raveculture.xyz -> SERVER_IP` (dns-only)
- `A *.agents.agentbot.raveculture.xyz -> SERVER_IP` (dns-only)

## 4) Optional overrides

```bash
FRONTEND_HOST="app.example.com" \
WWW_HOST="www.example.com" \
API_HOST="api.example.com" \
AGENTS_WILDCARD_HOST="*.agents.example.com" \
VERCEL_TARGET="cname.vercel-dns.com" \
ADD_WWW=1 \
CF_API_TOKEN="..." CF_ZONE_ID="..." SERVER_IP="..." \
./infra/scripts/cloudflare-autoconfig.sh
```

## 5) Verify

```bash
curl -I https://agentbot.raveculture.xyz
curl -I https://api.agentbot.raveculture.xyz/health
make prod-go-live-check
```

Cloudflare record + endpoint verification:

```bash
CF_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
CF_ZONE_ID="$CLOUDFLARE_ZONE_ID" \
SERVER_IP="<your-server-ip>" \
make cloudflare-verify
```
