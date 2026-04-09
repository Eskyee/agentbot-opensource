// baseFM DJ Streaming Skill
// Connects agents to baseFM onchain radio platform

const RAVE_TOKEN_ADDRESS = "0xdf3c79a5759eeedb844e7481309a75037b8e86f5";
const RAVE_TOKEN_THRESHOLD = "5000000000000000000000"; // 5000 RAVE in wei
const BASE_CHAIN_ID = 8453;
const MUX_RTMP_URL = "rtmp://global-live.mux.com:5222/app";

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
  const response = await fetch(process.env.NEXT_PUBLIC_APP_URL + "/api/basefm/live", {
    headers: { "Accept": "application/json" }
  });
  const data = await response.json();
  return data.djs || [];
}

// Create a new Mux stream for a verified DJ
async function createStream(djWallet, djName) {
  // Use agentbot API which handles RAVE verification and Mux stream creation
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.raveculture.xyz';
  
  const response = await fetch(apiUrl + "/api/basefm/streams", {
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
  
  return result.stream;
}

// Get stream playback URL for listeners
function getStreamUrl(playbackId) {
  return {
    hls: "https://stream.mux.com/" + playbackId + ".m3u8",
    embed: "https://stream.mux.com/" + playbackId + ".html",
    thumbnail: "https://image.mux.com/" + playbackId + "/thumbnail.webp"
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
  formatLiveAnnouncement
};