import { prisma } from '@/app/lib/prisma'

export const BASEFM_DJ_SKILL_NAME = 'DJ Streaming'
export const BASEFM_DEFAULT_STREAM_IMAGE =
  'https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje'

export function buildBasefmFfmpegCommandTemplate(fullRtmpUrl: string) {
  return [
    `ffmpeg -re -loop 1 -i "${BASEFM_DEFAULT_STREAM_IMAGE}"`,
    '-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100',
    '-c:v libx264 -preset veryfast -tune stillimage -pix_fmt yuv420p',
    '-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p"',
    '-g 60 -r 30 -b:v 3500k -maxrate 4500k -bufsize 7000k',
    '-c:a aac -b:a 256k -ar 44100 -ac 2',
    '-f flv',
    `"${fullRtmpUrl}"`,
  ].join(' ')
}

export const BASEFM_DJ_SKILL_CODE = String.raw`// baseFM DJ Streaming Skill
// Connects Agentbot/OpenClaw agents to the baseFM onchain radio stack.

const MUX_RTMP_URL = "rtmp://global-live.mux.com:5222/app";
const DEFAULT_STREAM_IMAGE = "https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.AGENTBOT_APP_URL || "https://agentbot.sh";
}

function getStreamUrl(playbackId) {
  return {
    hls: "https://stream.mux.com/" + playbackId + ".m3u8",
    embed: "https://stream.mux.com/" + playbackId + ".html?autoplay=true",
    thumbnail: "https://image.mux.com/" + playbackId + "/thumbnail.webp"
  };
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

async function getLiveDJs() {
  const response = await fetch(getApiUrl() + "/api/basefm/live", {
    headers: { "Accept": "application/json" }
  });
  const data = await response.json();
  return data.djs || [];
}

async function createStream(djWallet, djName) {
  const response = await fetch(getApiUrl() + "/api/basefm/streams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: djWallet, name: djName })
  });

  const result = await response.json();
  if (!response.ok) {
    return { error: result.error || "Failed to create stream" };
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

function formatLiveAnnouncement(djName, playbackId) {
  const urls = playbackId ? getStreamUrl(playbackId) : null;
  return {
    title: "🔴 " + djName + " is LIVE on baseFM",
    message: "Strictly underground. 24/7 autonomous curation. Tune in now." +
      (urls ? "\\n🎧 Listen: " + urls.embed : ""),
    actions: urls
      ? [
          { label: "Play Live", url: urls.embed },
          { label: "HLS Feed", url: urls.hls }
        ]
      : [],
  };
}

module.exports = {
  getLiveDJs,
  createStream,
  getStreamUrl,
  getFfmpegCommand,
  formatLiveAnnouncement,
};`

export async function ensureBasefmDjSkill() {
  const existing = await prisma.skill.findFirst({
    where: { name: BASEFM_DJ_SKILL_NAME },
    select: { id: true, code: true, description: true, category: true, featured: true },
  })

  const data = {
    name: BASEFM_DJ_SKILL_NAME,
    description: 'Create baseFM streams, fetch live DJs, and generate ffmpeg broadcaster commands for agent DJs.',
    category: 'streaming',
    code: BASEFM_DJ_SKILL_CODE,
    author: 'Agentbot',
    downloads: 150,
    rating: 5,
    featured: true,
  }

  if (existing) {
    if (
      existing.code !== data.code ||
      existing.description !== data.description ||
      existing.category !== data.category ||
      existing.featured !== data.featured
    ) {
      await prisma.skill.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          category: data.category,
          code: data.code,
          featured: data.featured,
        },
      })
    }

    return { id: existing.id }
  }

  const created = await prisma.skill.create({ data })
  return { id: created.id }
}
