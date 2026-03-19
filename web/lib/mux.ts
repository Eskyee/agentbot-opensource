import Mux from '@mux/mux-node';

/**
 * Lazy Mux singleton for Agentbot.
 * Instantiated on first call — never at module level (prevents Vercel build crashes).
 */

export const LEAN_ASSET_SETTINGS = {
  playback_policy: ['public'],
  video_quality: 'basic',
};

let _muxClient: Mux | null = null;

export function getMux(): Mux {
  if (!_muxClient) {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new Error('Mux credentials missing from environment. Live stream features will be disabled.');
    }
    _muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
  }
  return _muxClient;
}

export default getMux;
