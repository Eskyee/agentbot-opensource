// baseFM DJ Streaming Skill
// Connects agents to baseFM onchain radio platform

const RAVE_TOKEN_ADDRESS = "0xdf3c79a5759eeedb844e7481309a75037b8e86f5";
const RAVE_TOKEN_THRESHOLD = "5000000000000000000000"; // 5000 RAVE in wei
const BASE_CHAIN_ID = 8453;
const MUX_RTMP_URL = "rtmp://global-live.mux.com:5222/app";
const MUX_ASSETS_DOCS_URL = "https://www.mux.com/docs/api-reference/video/assets";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.AGENTBOT_APP_URL || "https://agentbot.sh";
const DEFAULT_STREAM_IMAGE = "https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje";

// Check if a wallet address has enough RAVE tokens for DJ access
async function verifyDJ(walletAddress) {
  // Query Base RPC for RAVE token balance
  const response = await fetch("https://mainnet.base.org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{
        to: RAVE_TOKEN_ADDRESS,
        data: "0x70a08231000000000000000000000000" + walletAddress.replace("0x", "")
      }, "latest"],
      id: 1
    })
  });
  const result = await response.json();
  const balance = BigInt(result.result || "0x0");
  const hasAccess = balance >= BigInt(RAVE_TOKEN_THRESHOLD);
  return {
    wallet: walletAddress,
    balance: balance.toString(),
    hasAccess,
    required: RAVE_TOKEN_THRESHOLD
  };
}

// Get list of currently live DJs on baseFM
async function getLiveDJs() {
  // Query agentbot API which proxies Mux for live streams
  const response = await fetch(APP_URL + "/api/basefm/live", {
    headers: { "Accept": "application/json" }
  });
  const data = await response.json();
  return data.djs || [];
}

function getFfmpegCommand(fullRtmpUrl) {
  return [
    'ffmpeg -re -loop 1 -i "' + DEFAULT_STREAM_IMAGE + '"',
    "-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100",
    "-c:v libx264 -preset veryfast -tune stillimage -pix_fmt yuv420p",
    '-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p"',
    "-g 60 -r 30 -b:v 3500k -maxrate 4500k -bufsize 7000k",
    "-c:a aac -b:a 256k -ar 44100 -ac 2",
    "-f flv",
    '"' + fullRtmpUrl + '"'
  ].join(" ");
}

// Create a new Mux stream for a verified DJ
async function createStream(djWallet, djName) {
  // Use agentbot API which handles RAVE verification and Mux stream creation
  const response = await fetch(APP_URL + "/api/basefm/streams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      wallet: djWallet,
      name: djName
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error || 'Failed to create stream' };
  }
  
  return {
    ...result.stream,
    session: result.session,
    ffmpeg: result.ffmpeg || {
      command: getFfmpegCommand(result.stream.fullRtmpUrl),
      inputHint: "Uses the default baseFM artwork image. Swap DEFAULT_STREAM_IMAGE if you want a different visual source."
    }
  };
}

// Get stream playback URL for listeners
function getStreamUrl(playbackId) {
  return {
    hls: "https://stream.mux.com/" + playbackId + ".m3u8",
    embed: "https://stream.mux.com/" + playbackId + ".html?autoplay=true",
    thumbnail: "https://image.mux.com/" + playbackId + "/thumbnail.webp"
  };
}

function getMuxAssetDocs() {
  return {
    url: MUX_ASSETS_DOCS_URL,
    note: "Use the Mux Assets API for replay retention, asset inspection, and cleanup after a baseFM set ends."
  };
}

// Announce DJ going live (for agent to post)
function formatLiveAnnouncement(djName, genre, listeners) {
  return {
    title: "🔴 " + djName + " is LIVE on baseFM",
    message: "Tune in now for " + (genre || "underground beats") + 
             "\\n🎧 Listen: https://basefm.space/live" +
             "\\n👤 Wallet: " + (listeners || "0") + " listening",
    actions: [
      { label: "Listen Live", url: "https://basefm.space/live" },
      { label: "Tip DJ", url: "https://basefm.space/tip/" + djName }
    ]
  };
}

// Export all functions
module.exports = {
  verifyDJ,
  getLiveDJs,
  createStream,
  getStreamUrl,
  getMuxAssetDocs,
  getFfmpegCommand,
  formatLiveAnnouncement
};
