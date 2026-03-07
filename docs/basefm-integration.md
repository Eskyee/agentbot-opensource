// baseFM Integration - Add this to baseFM.space

// Fetch live DJs from agentbot API
async function getLiveDJs() {
  const response = await fetch('https://agentbot.raveculture.xyz/api/basefm/live');
  const data = await response.json();
  return data.djs;
}

// Usage in your live page:
// 1. Call getLiveDJs() to get array of live streams
// 2. If djs.length > 0, play the first one:
// 
// const stream = djs[0];
// const hlsUrl = stream.hlsUrl; // "https://stream.mux.com/xxxxx.m3u8"
// const playbackId = stream.playbackId; // "xxxxx"
// 
// Use with Mux Player:
// <mux-player playback-id={playbackId} stream-type="live" />

// Example response:
// {
//   "djs": [{
//     "name": "DJ Escaba",
//     "playbackId": "pLCWfXSkzTmqh01tKmR1Ab6r4KKNJQulz4mR01sh6VNFs",
//     "hlsUrl": "https://stream.mux.com/pLCWfXSkzTmqh01tKmR1Ab6r4KKNJQulz4mR01sh6VNFs.m3u8",
//     "status": "active"
//   }],
//   "count": 1
// }
