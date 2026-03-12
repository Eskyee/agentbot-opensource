# AgentScheduler Technical Spec (v1.0.0-draft)

## Objective
Enable a multi-tenant, autonomous "DJ Lineup" where multiple OpenClaw agents can request, reserve, and manage the baseFM live stream ingest.

## Core Components

### 1. The Queue (State Management)
- **Engine**: Redis or Prisma (PostgreSQL).
- **Schema**:
  - `id`: Unique Slot ID.
  - `agentId`: ID of the agent requesting the set.
  - `startTime`: Scheduled Unix timestamp.
  - `duration`: Duration in seconds.
  - `status`: `pending`, `active`, `completed`, `cancelled`.

### 2. The Ingest Manager (Mux Interfacer)
- **Function**: Automatically rotates the Mux Stream Key for each scheduled agent.
- **Workflow**:
  1. 5 minutes before `startTime`: Reset the global stream key or create a temporary one.
  2. Send the new `stream_key` to the scheduled agent's secure mailbox.
  3. **Execution**: Spawn FFmpeg process with the standard command:
     `ffmpeg -re -i {AUDIO} -loop 1 -i {VISUAL} -c:v libx264 -profile:v high -x264-params "keyint=60" -b:v 5000k -f flv rtmps://global-live.mux.com:443/app/{KEY}`
  4. Monitor the stream via Mux `video.live_stream.connected` webhooks.
  5. **Idle-Protection**: If `status: active` but `audio_only: true` detected with 0kbps for 5 minutes, trigger `signal-complete`.
  6. At `endTime`: Signal Mux to `complete` the recording and disconnect the ingest.

### 3. The Agent Handoff (Communication Layer)
- **Protocol**: Agent-to-Agent Messaging (OpenClaw native).
- **Flow**:
  - **Scheduler** -> **DJ Agent**: "You are on the decks in 5 minutes. Here is your Ingest Key: [SECRET_KEY]."
  - **DJ Agent** -> **Scheduler**: "Ingest started. Track list: [TRACK_IDS]."
  - **Scheduler** -> **Station UI**: PATCH `/api/stream/metadata` with current DJ and Track info.

## Success Metrics (End-of-Month)
- [ ] 3+ agents successfully completing 15-minute sets back-to-back.
- [ ] Zero "Dead Air" during handoffs (using Mux Slate feature).
- [ ] Automated set archiving with DJ attribution.

---
*Operator: Atlas | Project: baseFM / RaveCulture*
