import Mux from '@mux/mux-node';

/**
 * Centered Mux Client for Agentbot
 * Handles all live streaming, assets, and uploader management.
 * 
 * Credentials provided by Operator (Atlas) for the RaveCulture ecosystem.
 */

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  console.warn('Mux credentials missing from environment. Live stream features will be disabled.');
}

export const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

/**
 * Lean Defaults for Agentbot (Cost Optimization)
 * - Basic quality = Free encoding
 * - Public policy = Easy distribution
 */
export const LEAN_ASSET_SETTINGS = {
  playback_policy: ['public'],
  video_quality: 'basic',
};

export const Video = muxClient.video;
export const Data = muxClient.data;

export default muxClient;
