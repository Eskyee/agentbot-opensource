/**
 * Shared utilities for agentbot-backend
 *
 * Includes:
 * - Command execution with retry logic
 * - Shell argument escaping (kept for callers that still need it)
 * - Container cleanup helpers
 *
 * NOTE: This module provides utilities for the planned Docker/Caddy integration.
 * See plans/BACKEND_CONSOLIDATION_PLAN.md for implementation roadmap.
 * Used by: lib/health.ts, lib/port-manager.ts, services/caddy.ts
 *
 * MED-06 FIX: Replaced exec() (shell-based, injection-prone) with spawn()
 * (arg-array, no shell). runCommand now takes (cmd, args[]) instead of a
 * single shell string. All internal helpers updated accordingly.
 */

import { spawn } from 'child_process';

export interface RunCommandOptions {
  maxBuffer?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Execute a command via spawn (no shell, no injection risk).
 * Arguments are passed as an array — never interpolated into a shell string.
 */
export const runCommand = (
  cmd: string,
  args: string[] = [],
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
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let timedOut = false;

      const child = spawn(cmd, args, { shell: false });

      const timer = timeout
        ? setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
          }, timeout)
        : null;

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes <= maxBuffer) stdoutChunks.push(chunk);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.length;
        if (stderrBytes <= maxBuffer) stderrChunks.push(chunk);
      });

      child.on('close', (code) => {
        if (timer) clearTimeout(timer);

        const stdout = Buffer.concat(stdoutChunks).toString('utf8').trim();
        const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();

        if (timedOut) {
          const err = new Error(`Command timed out after ${timeout}ms: ${cmd} ${args.join(' ')}`);
          if (attemptNumber < retries) {
            console.log(`Command timed out (attempt ${attemptNumber + 1}/${retries + 1}), retrying...`);
            setTimeout(() => attempt(attemptNumber + 1), retryDelay);
          } else {
            reject(err);
          }
          return;
        }

        if (code !== 0) {
          const err = new Error(stderr || `Command exited with code ${code}: ${cmd} ${args.join(' ')}`);
          if (attemptNumber < retries) {
            console.log(`Command failed (attempt ${attemptNumber + 1}/${retries + 1}), retrying...`);
            setTimeout(() => attempt(attemptNumber + 1), retryDelay);
          } else {
            reject(err);
          }
          return;
        }

        resolve({ stdout, stderr });
      });

      child.on('error', (err) => {
        if (timer) clearTimeout(timer);
        if (attemptNumber < retries) {
          console.log(`Command error (attempt ${attemptNumber + 1}/${retries + 1}), retrying...`);
          setTimeout(() => attempt(attemptNumber + 1), retryDelay);
        } else {
          reject(err);
        }
      });
    };

    attempt(0);
  });
};

/**
 * Escape a value for safe use in shell commands.
 * Kept for any callers that build shell strings externally, but prefer
 * passing args as arrays to runCommand() to avoid the shell entirely.
 */
export const escapeShellArg = (value: string): string =>
  `'${value.replace(/'/g, `'\\''`)}'`;

/**
 * Clean up a container and optionally its volume.
 * Uses spawn arg-array — no shell injection possible.
 */
export const cleanupContainer = async (
  containerName: string,
  volumeName?: string
): Promise<void> => {
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
 * Check if a container exists.
 */
export const containerExists = async (containerName: string): Promise<boolean> => {
  try {
    await runCommand('docker', ['inspect', containerName]);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get container status.
 */
export const getContainerStatus = async (
  containerName: string
): Promise<{ status: string; startedAt?: string } | null> => {
  try {
    const { stdout } = await runCommand('docker', [
      'inspect',
      containerName,
      '--format',
      '{{.State.Status}}|{{.State.StartedAt}}',
    ]);
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
