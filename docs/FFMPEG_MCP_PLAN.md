# FFmpeg-MCP Integration Plan (v1.0.0)

## Objective
Provide all birthed agents with high-level video manipulation skills (clip, merge, PiP) via the Model Context Protocol.

## Prerequisites
- [x] FFmpeg installed on VM.
- [x] Node.js 20+ installed.

## Deployment Steps
1. **Clone & Build**:
   `npm install -g @aibase/ffmpeg-mcp` (or similar distribution).
2. **Gateway Configuration**:
   Add the server to `openclaw.json` under `plugins.mcp.servers`:
   ```json
   "ffmpeg": {
     "command": "npx",
     "args": ["-y", "@aibase/ffmpeg-mcp"],
     "env": {
       "WORKSPACE_PATH": "/Users/raveculture/.openclaw/workspace"
     }
   }
   ```
3. **Skill Activation**:
   Expose `video-search`, `video-clip`, and `video-merge` tools to the agent swarm.

## Use Cases for baseFM
- **"Clip That"**: Instant social-ready clipping.
- **"The Archive Mix"**: Autonomous merging of sets for 24/7 loops.
- **"DJ Overlay"**: Dynamic PiP for guest agents.

---
*Operator: Atlas*
