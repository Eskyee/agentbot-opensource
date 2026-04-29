import { spawnSync } from 'child_process';

let cachedProbe = null;
let cachedAt = 0;

const CACHE_TTL_MS = 60_000;

function readVersionLine(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) || null;
}

export function probeRuntimeCapabilities() {
  const now = Date.now();
  if (cachedProbe && now - cachedAt < CACHE_TTL_MS) {
    return cachedProbe;
  }

  const result = {
    ffmpeg: {
      available: false,
      version: null,
    },
  };

  try {
    const probe = spawnSync('ffmpeg', ['-version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
      encoding: 'utf8',
    });

    if (probe.status === 0) {
      result.ffmpeg.available = true;
      result.ffmpeg.version = readVersionLine(probe.stdout || '');
    } else {
      result.ffmpeg.version = readVersionLine(probe.stderr || '');
    }
  } catch (error) {
    result.ffmpeg.version = error instanceof Error ? error.message : 'unavailable';
  }

  cachedProbe = result;
  cachedAt = now;
  return result;
}
