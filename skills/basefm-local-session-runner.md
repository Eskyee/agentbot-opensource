# baseFM Local Session Runner

## Purpose

Use this skill when you want to take a local audio file, turn it into a stable baseFM live session, verify that it is really on-air, and close it cleanly so the archive is preserved.

This skill exists because the hard part is not just "stream a file".
The real path is:
- choose a usable source file
- normalize it if the source is dirty
- mint a fresh app-created BaseFM stream
- feed the cleaned file to the RTMP key
- verify Mux active state and BaseFM live state
- stop the session cleanly so the archive survives

## When To Use It

Use this skill for:
- archived DJ sets
- local MP3/M4A/WAV/FLAC playback tests
- proving that baseFM can play a real session from a local file
- repeatability tests across multiple source files

Do not use it when:
- the user wants microphone/OBS capture instead of file playback
- the source rights are unclear and the user is asking for public distribution advice

## Golden Rules

1. HLS is the truth.
- Trust the `.m3u8` plus Mux `active`/`connected` state.
- Do not rely only on the hosted Mux `.html` page.

2. Fresh app-created streams beat stale recovery loops.
- If an older stream key gets weird, mint a fresh BaseFM stream through the app path.

3. Dirty source media should be normalized first.
- Raw archival MP3s can produce ingest drops or broken pipes.
- Convert to clean AAC first when stability matters.

4. Stop cleanly and keep the archive reference.
- When the session ends, confirm the live stream is `idle`.
- Record the good asset id / playback id and ignore false-start errored assets.

## Inputs

- Local audio file path
- DJ/set title
- Verified wallet path:
  - RAVE wallet, or
  - claimed Agentbot community-pass wallet

## Workflow

### Step 1: Inspect the source file

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,sample_rate,channels -of json "/path/to/file.mp3"
```

Check:
- there is a real audio stream
- duration is sensible
- sample rate / channels look normal

### Step 2: Normalize the audio if needed

For archived or unstable MP3s, convert to clean AAC:

```bash
ffmpeg -y -i "/path/to/file.mp3" -map 0:a:0 -c:a aac -b:a 256k /tmp/basefm-session.m4a
```

Then verify the normalized file:

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,sample_rate,channels -of json /tmp/basefm-session.m4a
```

### Step 3: Mint a fresh BaseFM app stream

Call the real app endpoint:

```bash
POST /api/basefm/streams
```

Use:
- the RAVE wallet if it passes the token gate
- otherwise the claimed Agentbot wallet when community pass is the active access path

Capture:
- `stream.id`
- `stream.streamKey`
- `stream.playbackId`
- `stream.fullRtmpUrl`
- `session.id`

### Step 4: Start the local file as a live video+audio stream

Use the shared BaseFM artwork image as the video layer and the cleaned audio file as the audio source:

```bash
ffmpeg -nostdin \
  -re -loop 1 -framerate 30 -i /tmp/basefm-default.jpg \
  -re -i /tmp/basefm-session.m4a \
  -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset veryfast -tune stillimage -pix_fmt yuv420p \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p" \
  -g 60 -r 30 -b:v 3500k -maxrate 4500k -bufsize 7000k \
  -c:a copy \
  -f flv \
  "rtmp://global-live.mux.com:5222/app/<streamKey>"
```

Notes:
- Prefer `-c:a copy` when the normalized file is already AAC and accepted by the target path.
- If copy causes trouble, re-encode audio to AAC in the final ffmpeg run.

### Step 5: Verify that it is really live

Check Mux:

```bash
GET https://api.mux.com/video/v1/live-streams/<streamId>
```

Required:
- `status: active`
- `connected: true`
- `active_asset_id` present

Check BaseFM:

```bash
GET /api/basefm/live
```

Required:
- `count: 1` (or expected active count)
- current playback ID present

Check HLS:

```bash
ffprobe -v error -show_streams -of json "https://stream.mux.com/<playbackId>.m3u8"
```

Required:
- video stream exists
- audio stream exists

### Step 6: Name the set properly

If the live page falls back to `Anonymous DJ`, enrich the session metadata:
- session title should live in `dj_sessions.dj_name`
- use `mux_stream_id` as the join key

Good example:
- `Kiss 100 FM London 1996-07-10 — LTJ Bukem`

### Step 7: Stop the session cleanly

Kill the active ffmpeg ingest, then wait for Mux to fall back to `idle`.

Verify:

```bash
GET https://api.mux.com/video/v1/live-streams/<streamId>
GET /api/basefm/live
```

Expected:
- Mux stream `status: idle`
- BaseFM live API empty / no active DJs

### Step 8: Preserve the good archive reference

After stopping, record:
- live stream id
- usable asset id
- archive playback id

Ignore:
- errored false-start assets with insufficient video data

## Success Criteria

This skill is successful only when all of the below are true:
- stream was created through the real BaseFM app path
- source media was validated and cleaned if necessary
- Mux reached `active` with `connected: true`
- BaseFM live API showed the stream
- HLS exposed both audio and video
- stopping the ingest returned the stream to `idle`
- the good archive asset was identified and preserved

## Defaults

Shared artwork:
- `https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje`

RTMP server:
- `rtmp://global-live.mux.com:5222/app`

## Output

When used properly, the output should include:
- source file path used
- stream id
- playback id
- HLS URL
- final live verification result
- final archive asset id / archive playback id after stop
