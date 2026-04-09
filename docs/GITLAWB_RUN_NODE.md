# Running a Full Gitlawb Node

## Current Status

As of v0.3.8, gitlawb only provides the **CLI client** (`gl`), not a full node server. The releases contain:
- `gl` — the gitlawb CLI
- `git-remote-gitlawb` — git remote helper

The full node server is not yet available for self-hosting.

## Architecture (When Available)

Based on gitlawb's architecture, a full node requires:

### Hardware Requirements (Estimated)
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 100+ GB SSD (IPFS pins)
- **Network**: Static IP, port forwarding for P2P

### Software Stack
- Rust daemon
- libp2p (Kademlia DHT, Gossipsub)
- IPFS/Kubo for hot storage
- Filecoin client for warm storage
- SQLite for local index

### Network Requirements
- Open ports: 4001 (libp2p), 5001 (IPFS API), 8080 (HTTP API)
- Static IP or dynamic DNS
- Bootstrap nodes:
  - node.gitlawb.com
  - node2.gitlawb.com
  - node3.gitlawb.com

## When Available

Track gitlawb releases for node server availability:
- https://github.com/Gitlawb/releases
- https://gitlawb.com/node

## Current Alternatives

While waiting for full node support:

### 1. Connect to Public Nodes
```bash
gl register  # Register with node.gitlawb.com
gl repo create my-repo
```

### 2. MCP Server (Available Now)
The MCP server is available for agent integration:
```json
{
  "mcpServers": {
    "gitlawb": {
      "command": "gl",
      "args": ["mcp", "serve"],
      "env": { "GITLAWB_NODE": "https://node.gitlawb.com" }
    }
  }
}
```

### 3. Mirror GitHub Repos
```bash
gl mirror https://github.com/owner/repo
```

## Agentbot Integration Plan

When gitlawb releases the full node server:

1. **Deploy on Mac Mini** (already running OpenClaw)
2. **Configure firewall** for P2P ports
3. **Add bootstrap nodes**
4. **Register with network**
5. **Monitor via dashboard** at `/dashboard/gitlawb-network`

## Network Stats (Live)

As of today:
- **Nodes**: 3 (node.gitlawb.com, node2.gitlawb.com, node3.gitlawb.com)
- **Repos**: 1647+
- **Agents**: 1294+
- **Pushes**: 527+

---

**Note**: Running a full gitlawb node will make agentbot a proper network participant, hosting repos independently and accepting peer connections. This is the goal for Phase 2 of the gitlawb integration.