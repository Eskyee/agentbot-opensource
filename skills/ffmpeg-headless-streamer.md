# FFmpeg Headless Streamer Skill

Push audio (or audio+visual) streams directly from an agent container to any RTMP endpoint — no OBS, no display, no GPU overhead. Built for the Co-DJ handoff flow on baseFM and autonomous agent sets.

---

## When to use this skill

- An agent needs to hold down a live set on baseFM without a human at the controls
- A Co-DJ B2B handoff fires and the agent is the "DJ2" waiting to take over
- You want to stream a playlist, audio file, or generated audio to Mux from a Railway/Docker container
- OBS is too heavy for the environment (no display server, no GPU)

---

## Core concept

FFmpeg runs inside the agent's container. It reads an audio source (file, pipe, or lavfi test tone) and pushes to the Mux RTMP URL using the shared Co-Show stream key. The process is managed as a child process — started on handoff signal, killed on set end.

Two simultaneous FFmpeg encoders cannot push to the same Mux stream key. The Co-DJ handoff window (`reconnect_window: 120`) means the active encoder MUST stop before the agent's encoder connects.

---

## Install check

```bash
which ffmpeg || apt-get install -y ffmpeg
ffmpeg -version | head -1
```

---

## Audio-only stream (recommended for DJ agents)

Push an MP3 file or playlist to Mux. No video, minimal CPU:

```bash
ffmpeg -re \
  -i /path/to/set.mp3 \
  -c:a aac -b:a 128k -ar 44100 -ac 2 \
  -f flv \
  "rtmps://global-live.mux.com:443/app/{STREAM_KEY}"
```

For a directory of tracks in order:

```bash
# Build a concat list
ls /sets/*.mp3 | sed "s/^/file '/;s/$/'/" > /tmp/playlist.txt

ffmpeg -re \
  -f concat -safe 0 -i /tmp/playlist.txt \
  -c:a aac -b:a 128k -ar 44100 -ac 2 \
  -f flv \
  "rtmps://global-live.mux.com:443/app/{STREAM_KEY}"
```

---

## Audio + still image (for visual presence on stream)

Same CPU profile as audio-only (libx264 with `stillimage` tune is cheap):

```bash
ffmpeg -re \
  -loop 1 -i /path/to/artwork.jpg \
  -i /path/to/set.mp3 \
  -c:v libx264 -preset veryfast -tune stillimage -pix_fmt yuv420p \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p" \
  -g 60 -r 30 -b:v 1500k -maxrate 2000k -bufsize 4000k \
  -c:a aac -b:a 128k -ar 44100 -ac 2 \
  -shortest \
  -f flv \
  "rtmps://global-live.mux.com:443/app/{STREAM_KEY}"
```

---

## Agent process manager (Node.js / TypeScript)

Use this pattern inside an OpenClaw skill or agentbot-backend route to manage the FFmpeg child process:

```typescript
import { spawn, ChildProcess } from 'child_process'

let ffmpegProcess: ChildProcess | null = null

/**
 * Start streaming to Mux. Returns false if already streaming.
 */
export function startStream(streamKey: string, audioPath: string): boolean {
  if (ffmpegProcess) return false

  const rtmpUrl = `rtmps://global-live.mux.com:443/app/${streamKey}`

  ffmpegProcess = spawn('ffmpeg', [
    '-re',
    '-i', audioPath,
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-ac', '2',
    '-f', 'flv',
    rtmpUrl,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  ffmpegProcess.stderr?.on('data', (data: Buffer) => {
    // FFmpeg logs to stderr — pipe to your logger
    process.stderr.write(data)
  })

  ffmpegProcess.on('exit', (code) => {
    ffmpegProcess = null
    console.log(`[ffmpeg] exited with code ${code}`)
  })

  return true
}

/**
 * Stop the stream gracefully (SIGTERM → ffmpeg flushes and exits).
 * Call this BEFORE the next DJ connects — Mux needs the RTMP connection
 * closed before reconnect_window kicks in.
 */
export function stopStream(): void {
  if (!ffmpegProcess) return
  ffmpegProcess.kill('SIGTERM')
  ffmpegProcess = null
}

export function isStreaming(): boolean {
  return ffmpegProcess !== null
}
```

---

## Co-DJ handoff integration

Wire this into the Supabase Realtime handoff signal from `useCoShowSignaling`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { startStream, stopStream, isStreaming } from './ffmpeg-streamer'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export function listenForHandoff(coShowId: string, streamKey: string, audioPath: string) {
  const channel = supabase.channel(`co-show:${coShowId}`)

  channel
    .on('broadcast', { event: 'handoff-request' }, () => {
      console.log('[co-dj-agent] Handoff received — starting encoder')
      startStream(streamKey, audioPath)
    })
    .on('broadcast', { event: 'end-show' }, () => {
      console.log('[co-dj-agent] Show ended — stopping encoder')
      stopStream()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}
```

The active human DJ clicks HANDOFF in CoShowStudio → `handoff-request` broadcast fires → agent's FFmpeg connects within the 120s window → Mux reconnects → pirate radio continues without a drop.

---

## Resource profile (Railway / Docker)

| Mode | CPU | RAM |
|------|-----|-----|
| Audio-only AAC 128k | ~2–5% | ~30 MB |
| Audio + stillimage 720p | ~8–15% | ~60 MB |
| OBS (for reference) | ~30–80% | ~500 MB+ |

Audio-only is the correct mode for agent sets. No display server needed.

---

## Environment variables required

```
MUX_RTMP_URL=rtmps://global-live.mux.com:443/app
# Stream key comes from the co_shows table (mux_stream_key column)
# or from createMuxCoShowStream() in lib/streaming/mux.ts
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Connection refused` on RTMP | Check stream key — must match the active Mux stream |
| `av_interleaved_write_frame(): Broken pipe` | Previous encoder still connected — wait for `reconnect_window` or kill it first |
| High CPU | Add `-preset ultrafast` to libx264 or switch to audio-only |
| Stream drops immediately | Mux stream may be in `idle` state — create/activate it first via the API |
