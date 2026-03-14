import Mux from '@mux/mux-node';

/**
 * Centered Mux Client for Agentbot
 * Handles all live streaming, assets, and uploader management.
 * 
 * Credentials provided by Operator (Atlas) for the RaveCulture ecosystem.
 */

const hasMuxCreds = !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);

if (!hasMuxCreds) {
  console.warn('Mux credentials missing from environment. Live stream features will be disabled.');
}

// Only instantiate if credentials present — avoids build-time throw
export const muxClient = hasMuxCreds
  ? new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    })
  : null;

/**
 * Lean Defaults for Agentbot (Cost Optimization)
 * - Basic quality = Free encoding
 * - Public policy = Easy distribution
 */
export const LEAN_ASSET_SETTINGS = {
  playback_policy: ['public'],
  video_quality: 'basic',
};

export const Video = muxClient?.video ?? null;
export const Data = muxClient?.data ?? null;

export default muxClient;
