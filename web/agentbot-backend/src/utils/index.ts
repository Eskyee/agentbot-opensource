/**
 * Shared utilities for agentbot-backend
 * 
 * Includes:
 * - Command execution with retry logic
 * - Shell argument escaping
 * - Container cleanup helpers
 * 
 * NOTE: This module provides utilities for the planned Docker/Caddy integration.
 * See plans/BACKEND_CONSOLIDATION_PLAN.md for implementation roadmap.
 * Used by: lib/health.ts, lib/port-manager.ts, services/caddy.ts
 */

import { exec } from 'child_process';

export interface RunCommandOptions {
  maxBuffer?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Execute a shell command with optional retry logic
 */
export const runCommand = (
  command: string,
  options: RunCommandOptions = {}
): Promise<{ stdout: string; stderr: string }> => {
  const {
    maxBuffer = 10 * 1024 * 1024,
    timeout = 60000,
    retries = 0,
    retryDelay = 1000,
  } = options;

  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber: number) => {
      exec(
        command,
        { maxBuffer, timeout },
        (error, stdout, stderr) => {
          if (error) {
            if (attemptNumber < retries) {
              console.log(`Command failed (attempt ${attemptNumber + 1}/${retries + 1}), retrying...`);
              setTimeout(() => attempt(attemptNumber + 1), retryDelay);
              return;
            }
            reject(new Error(stderr || error.message));
            return;
          }
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        }
      );
    };
    attempt(0);
  });
};

/**
 * Escape a value for safe use in shell commands
 */
export const escapeShellArg = (value: string): string =>
  `'${value.replace(/'/g, `'\\''`)}'`;

/**
 * Clean up a container and optionally its volume
 */
export const cleanupContainer = async (
  containerName: string,
  volumeName?: string
): Promise<void> => {
  try {
    await runCommand(`docker rm -f ${escapeShellArg(containerName)}`);
  } catch {
    // Container might not exist
  }

  if (volumeName) {
    try {
      await runCommand(`docker volume rm ${escapeShellArg(volumeName)}`);
    } catch {
      // Volume might not exist or be in use
    }
  }
};

/**
 * Check if a container exists
 */
export const containerExists = async (containerName: string): Promise<boolean> => {
  try {
    await runCommand(`docker inspect ${escapeShellArg(containerName)}`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get container status
 */
export const getContainerStatus = async (
  containerName: string
): Promise<{ status: string; startedAt?: string } | null> => {
  try {
    const { stdout } = await runCommand(
      `docker inspect ${escapeShellArg(containerName)} --format '{{.State.Status}}|{{.State.StartedAt}}'`
    );
    const [rawStatus, startedAt] = stdout.split('|');
    let status = rawStatus;
    if (rawStatus === 'running') {
      status = 'active';
    } else if (rawStatus === 'exited') {
      status = 'stopped';
    }
    return { status, startedAt };
  } catch {
    return null;
  }
};

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
