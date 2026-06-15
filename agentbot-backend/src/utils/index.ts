/**
 * Shared utilities for agentbot-backend
 */

export * from './secure-exec';

/**
 * Clean up a container and optionally its volume.
 * Uses spawn arg-array — no shell injection possible.
 */
export const cleanupContainer = async (
  containerName: string,
  volumeName?: string
): Promise<void> => {
  const { runCommand } = require('./secure-exec');
  try {
    await runCommand('docker', ['rm', '-f', containerName]);
  } catch {
    // Container might not exist — ignore
  }

  if (volumeName) {
    try {
      await runCommand('docker', ['volume', 'rm', volumeName]);
    } catch {
      // Volume might not exist or may be in use — ignore
    }
  }
};

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
