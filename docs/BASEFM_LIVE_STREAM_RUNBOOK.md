# baseFM Live Stream Runbook

This is the practical runbook for getting baseFM live playback working end to end on Agentbot.

It exists because the hard part was not only creating streams. The real work was:
- making the BaseFM page behave like a station
- making Mux playback work on the main site
- keeping the ingest alive long enough to create an active live asset
- preserving the right session title and artwork
- making the Agentbot token path visible, not just the RAVE path

## Current Working Baseline

- Canonical live page: `/basefm/live`
- Canonical live API: `/api/basefm/live`
- Canonical stream creation API: `/api/basefm/streams`
- Streaming provider: Mux
- Ingest transport: RTMP
- Listener source of truth: HLS `.m3u8`
- Player on site: `mux-player`

Important rule:
- Treat the Mux hosted `.html` page as optional and sometimes flaky.
- Treat the HLS `.m3u8` stream plus the site player as the real playback path.

## Relay Requirement

BaseFM should not be treated as a single-destination stream product.

Current requirement:
- the stream must play correctly on Agentbot
- the stream must relay correctly to `basefm.space`

Forward requirement:
- users will want one origin stream fan out to multiple destinations
- expected destinations include `basefm.space`, YouTube, and future third-party endpoints

Product rule:
- Agentbot/baseFM is the canonical first-party stream surface.
- design the stream path as `origin ingest -> canonical live asset -> downstream relays`
- do not couple the product to a single consumer surface
- do not assume the first listener surface is the only one that matters

Ownership rule:
- `agentbot.sh/basefm/live` is first-party and canonical
- `basefm.space` is important, but it is a downstream relay consumer
- future YouTube or external relays are also downstream consumers
- no downstream destination should become the source of truth for stream state, naming, or control

Operational implication:
- if `basefm.space` is not relaying correctly, treat that as a real streaming failure, not a cosmetic issue
- future relay health needs to be first-class in both the API and dashboard

## Access Model

There are two supported stream-access paths:

1. RAVE gate
- Wallet holds enough RAVE on Base
- Stream may be created directly with that wallet

2. Agentbot community pass
- User has claimed Agentbot Builder/Whale rewards
- Stream must use the claimed wallet when the community pass is the active gate

Important lesson:
- The backend already supported the Agentbot pass path.
- The DJ Stream page had to be updated so the claimed wallet is visible and actually used for stream creation.

## Page-Level Lessons

### 1. `/basefm/live` must be dynamic

Problem:
- A prerendered live page can serve a stale loading shell even when the stream is already live.

Fix:
- Make `/basefm/live` dynamic and server-seed the current live data into the page.

Why:
- A live station page cannot depend on a static shell plus delayed client polling.

### 2. Keep the station look, but make playback first

Problem:
- The page looked nice, but the player area could feel like a wrapper instead of the station.

Fix:
- Keep the branded page structure
- Make the top of the page player-first
- Keep heavier marketing/info sections below the fold

### 3. Use the shared BaseFM artwork for standby

Default standby/broadcast artwork:
- `https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje`

Use it:
- in ffmpeg command templates
- in the checked-in skill docs
- in the live player standby state when nothing is live

## Browser Playback Lessons

### Desktop worked while iPhone failed

Root cause:
- stale or wrong playback URL at first
- then site CSP blocked the Mux player and Mux media/network paths

Critical fix:
- `web/next.config.js` CSP had to allow:
  - `https://cdn.jsdelivr.net`
  - `https://*.mux.com`
  - `media-src https://*.mux.com`
  - `connect-src https://*.mux.com`

Without that:
- the stream can be healthy in Mux
- HLS can exist
- but the main BaseFM page still fails in-browser

## Mux Lessons

### 1. A created stream is not a live stream

`201 Created` only means:
- Mux stream object exists
- playback ID exists
- stream key exists

It does not mean:
- active asset exists
- ingest is connected
- listeners can play it yet

### 2. `idle` means ingest died or never held

If Mux shows:
- `status: idle`

then there is no active ingest path, even if the playback ID still exists.

This is exactly when the player shows:
- `Live stream is not currently available`

### 3. Fresh app-created BaseFM streams are safer than trying to reuse poisoned ones

Observed pattern:
- repeated failed reconnects on an older stream key can leave you wasting time
- minting a fresh BaseFM app stream is often faster and cleaner

Use the app path:
- `POST /api/basefm/streams`

not ad hoc raw Mux stream creation when proving the product path.

## Ingest Lessons

### 1. Raw media containers can be the real problem

Observed with:
- `Kiss_100_FM_London_-_1996-07-10_-_LTJ_Bukem-320kbps-KMA.mp3`

Problem:
- the original MP3 container had decode irregularities
- ffmpeg could start ingest, but Mux would end up with short-lived assets or broken-pipe failures

Working fix:
- transcode the source into a clean audio-only AAC file first
- then stream the clean file to Mux

In practice:
- dirty source file -> unstable ingest
- cleaned AAC file -> stable active stream

### 2. HLS is the truth

When verifying:
- prefer `ffprobe` on the `.m3u8`
- verify both video and AAC stereo streams exist

That is a better signal than trusting the hosted Mux HTML wrapper alone.

## Naming Lessons

Problem:
- active stream could still show `Anonymous DJ`
- Mux metadata is not always enough on its own

Fix:
- enrich active live API results from `dj_sessions` by `mux_stream_id`
- use the session `dj_name` when Mux metadata is sparse

This keeps the real set title visible on the site.

## Current Operational Truth

For BaseFM live playback:
- source of truth for availability: Mux live stream status
- source of truth for naming fallback: `dj_sessions`
- source of truth for final listener playback: site page + HLS

For BaseFM distribution:
- first-party origin and first-party playback stay canonical
- origin stream health and relay health are separate concerns
- `Agentbot page works` is not enough if `basefm.space` or future external relays are broken
- relay status should eventually be exposed per destination

## Recommended Verification Order

When debugging again, do it in this order:

1. Check BaseFM live API
- `GET /api/basefm/live`

2. Check Mux live stream status
- `status`
- `connected`
- `active_asset_id`

3. Check HLS manifest
- confirm the `.m3u8` exists
- confirm real audio/video tracks

4. Check site CSP / player path
- if HLS works but page does not, inspect CSP before anything else

5. Only then inspect page copy/UI state

## Anti-Regression Rules

- Do not rely on the Mux hosted `.html` page as the primary proof of playback.
- Do not make `/basefm/live` static again.
- Do not hide the Agentbot token pass behind RAVE-only wording.
- Do not let the standby state become a blank player shell.
- Do not trust a dirty source media file when ingest is dropping; normalize/transcode first.
- Do not treat `created` as `live`.
- Do not let an external relay become the canonical product surface over `agentbot.sh/basefm/live`.
- Do not treat successful playback on `agentbot.sh/basefm/live` as sufficient if `basefm.space` relay is unhealthy.
- Do not hardcode the architecture around one destination when downstream multi-relay demand is expected.

## Good Final State

The product should feel like this:
- connect wallet
- either RAVE or Agentbot token claim grants access
- create stream
- ingest starts
- BaseFM page plays it directly
- downstream relays receive the stream reliably
- off-air still looks branded
- current set title is visible
- users never need to care whether the underlying issue was Mux, CSP, or ingest

## Next Architecture Expectation

The next durable version of BaseFM streaming should support:

- a canonical origin ingest
- destination relay tracking
- per-destination health states
- future multi-destination publishing
- YouTube-ready relay support without redesigning the pipeline later
