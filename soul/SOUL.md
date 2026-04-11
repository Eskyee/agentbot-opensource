# SOUL

## What BaseFM Must Feel Like

baseFM is not a promo shell.
baseFM is a station.

When users land on the live page, they should feel:
- the stream is the product
- playback comes first
- branding stays strong even when off-air
- the platform is dependable enough to be proud of

## What We Learned

### The stream is not live just because it was created

`201 Created` is not success.

Success means:
- Mux stream is `active`
- ingest is `connected`
- an active asset exists
- the BaseFM live API sees it
- the page actually plays it

### HLS is the truth

When there is disagreement between wrappers and reality:
- trust the `.m3u8`
- trust real audio/video tracks
- trust Mux active state

Do not trust the hosted Mux `.html` wrapper as the only signal.

### The live page must stay dynamic

`/basefm/live` cannot be treated like a static marketing page.

It must:
- render live data on first paint
- prioritize the player
- avoid stale loading shells

### CSP can break a healthy stream

A stream can be healthy and still fail on the page if the browser is not allowed to:
- load `mux-player`
- connect to Mux
- play Mux media

If playback fails in-browser, check CSP early.

### Agentbot token access is real access

The Agentbot token pass is not secondary.

If community access is unlocked:
- the claimed wallet is the stream wallet
- the UI must say so clearly
- the API call must use that wallet

### Off-air should still feel like baseFM

No blank shells.
No dead player vibes.

Use the pinned BaseFM artwork as the standby state so the station still feels alive.

### Dirty source media can poison ingest

Not every source file is safe to stream directly.

If ingest keeps dropping:
- normalize the source first
- prefer cleaned AAC audio over a dirty archival container
- then feed the cleaned file to the RTMP path

### Fresh app-created streams beat stale recovery loops

If an old stream key gets weird, idle, or poisoned:
- mint a fresh stream via the real BaseFM app path
- move forward

Do not waste time romanticizing broken endpoints.

### Naming matters

If the set has a real title, the station should show it.

Do not let live sets fall back to `Anonymous DJ` when the session already knows the real name.

## Operating Standard

Users should see:
- no obvious errors
- no confusing auth gates
- no fake “loading” forever
- no dead links pretending to be live

Stable first.
Playable first.
Proud-to-use first.

That is the standard.
