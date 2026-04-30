# Tailscale for Managed Agents

Managed agents can optionally join a user's Tailscale tailnet during provisioning and let OpenClaw expose the Gateway through Tailscale Serve or Funnel.

Remote access is a user choice. The default is off; omitting `remoteAccess` and `tailscale` keeps the managed runtime on the platform default path. Do not enable Tailscale globally for every user.

## User Setup Help

When a user chooses remote access, guide them through the smallest setup that matches their goal.

Ask what they need:

- Choose `ssh` when they already have SSH access to the host and want the safest universal fallback.
- Choose `tailscale-serve` when they want tailnet-only HTTPS access to the Control UI and WebSocket.
- Choose `tailscale-funnel` only when they intentionally want public HTTPS access and can set a shared password.
- Choose `tailnet` when they want OpenClaw to listen directly on the Tailnet IP without Serve/Funnel HTTPS automation.

Do not ask users to paste a platform-owned auth key. They should create an auth key in their own Tailscale admin console. Prefer ephemeral keys for temporary agents and tagged reusable keys for durable agents.

For Tailscale choices, collect:

- Tailscale auth key.
- Optional hostname, such as `agentbot-studio`.
- Optional tags, such as `tag:agentbot`, if their tailnet ACLs require tags.
- For Funnel only: a gateway password.

For SSH choices, collect:

- SSH target, such as `user@host`.
- Optional identity path, such as `~/.ssh/id_ed25519`.
- Gateway port, default `18789`.

Then show the user the exact client command:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

After the tunnel is open, clients connect to:

```text
ws://127.0.0.1:18789
```

SSH tunnels do not bypass OpenClaw auth. Users still need the configured gateway token or password.

## Runtime Image Requirement

Tailscale support requires the runtime image to include:

- `tailscale`
- `tailscaled`
- `/usr/local/bin/agentbot-tailscale-start`

Both `gateway/Dockerfile` and `agentbot-backend/docker/Dockerfile.agent` include those binaries. Build and publish one of those images, then set `OPENCLAW_IMAGE` to that image for managed Railway provisioning.

If a provision request includes a Tailscale auth key but the image does not include `agentbot-tailscale-start`, startup fails instead of silently deploying an agent without tailnet access.

## Provision Request

Pass a `tailscale` object when creating an agent:

```json
{
  "plan": "solo",
  "agentType": "business",
  "autoProvision": true,
  "tailscale": {
    "enabled": true,
    "mode": "serve",
    "authKey": "tskey-auth-...",
    "hostname": "agentbot-my-agent",
    "tags": ["tag:agentbot"],
    "acceptRoutes": true
  }
}
```

Use an ephemeral or reusable auth key created in the user's own tailnet. Do not configure a shared platform-wide user auth key.

The public APIs also accept a higher-level `remoteAccess` choice:

```json
{
  "remoteAccess": {
    "type": "tailscale-serve",
    "authKey": "tskey-auth-...",
    "hostname": "agentbot-my-agent"
  }
}
```

Supported `remoteAccess.type` values:

- `off`: no remote access automation.
- `ssh`: no runtime mutation; users connect with an SSH `LocalForward` to `127.0.0.1:18789`.
- `tailscale-serve`: maps to Tailscale Serve.
- `tailscale-funnel`: maps to Tailscale Funnel and requires `password`.
- `tailnet`: direct Tailnet IP bind with token auth.

Example SSH user choice:

```json
{
  "remoteAccess": {
    "type": "ssh",
    "sshTarget": "user@example.com",
    "sshIdentity": "~/.ssh/id_ed25519",
    "port": 18789
  }
}
```

The `ssh` choice is stored/used for guidance only. It does not expose the server or alter OpenClaw Gateway binding.

Example Funnel user choice:

```json
{
  "remoteAccess": {
    "type": "tailscale-funnel",
    "authKey": "tskey-auth-...",
    "hostname": "agentbot-public-demo",
    "password": "shared-gateway-password"
  }
}
```

Supported modes:

- `serve` defaults to OpenClaw's `gateway.tailscale.mode: "serve"` with `gateway.bind: "loopback"` and `gateway.auth.allowTailscale: true`.
- `funnel` sets `gateway.tailscale.mode: "funnel"` and requires `tailscale.password`, which is passed as `OPENCLAW_GATEWAY_PASSWORD`.
- `tailnet` binds OpenClaw directly to the Tailnet IP with token auth and does not use Serve/Funnel HTTPS automation.

## Network Mode

The startup script logs the container into Tailscale using userspace networking, which works on container platforms without `/dev/net/tun`. OpenClaw then manages Serve/Funnel through its own Gateway Tailscale integration.

The agent receives:

- `TAILSCALE_SOCKS5_SERVER=127.0.0.1:1055`
- `TAILSCALE_OUTBOUND_HTTP_PROXY_LISTEN=127.0.0.1:1055`
- `AGENTBOT_TAILSCALE_PROXY=socks5://127.0.0.1:1055`

OpenClaw remote access is configured through `gateway.tailscale`. Tools that need outbound tailnet access can also use `AGENTBOT_TAILSCALE_PROXY` or the local HTTP/SOCKS proxy address.

For SSH remote access, keep the Gateway loopback-only and have the operator create a tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Then clients connect to `ws://127.0.0.1:18789` with the normal gateway token or password.
