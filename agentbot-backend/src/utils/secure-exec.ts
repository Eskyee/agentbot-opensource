import { spawn } from 'child_process';
import { quote } from 'shell-quote';

export interface RunCommandOptions {
  maxBuffer?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cwd?: string;
}

/**
 * Executes a command with arguments using child_process.spawn.
 * Mitigates shell injection by avoiding the shell entirely.
 */
const executeOnce = (
  cmd: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<{ stdout: string; stderr: string }> => {
  const { maxBuffer = 10 * 1024 * 1024, timeout = 60000, cwd } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: false, cwd });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = timeout
      ? setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeout)
      : null;

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) return reject(new Error(`Command timed out after ${timeout}ms: ${cmd} ${args.join(' ')}`));
      if (code !== 0) return reject(new Error(stderr.trim() || `Command failed with exit code ${code}`));
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
  });
};

/**
 * Executes a command with arguments using child_process.spawn.
 * Mitigates shell injection by avoiding the shell entirely.
 * Supports automatic retries with exponential backoff.
 */
export const runCommand = async (
  cmd: string, 
  args: string[] = [], 
  options: RunCommandOptions = {}
): Promise<{ stdout: string; stderr: string }> => {
  const { retries = 0, retryDelay = 1000, ...execOptions } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await executeOnce(cmd, args, execOptions);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

/**
 * Securely executes a shell command by quoting arguments.
 * Useful when shell features like redirections (>) or pipes (|) are needed.
 * 
 * @param template The shell command template with placeholders for arguments
 * @param args The arguments to be quoted and interpolated
 * 
 * Placeholders are the literal token `{}`. Each is replaced, left to right,
 * with the shell-quoted form of the corresponding argument.
 *
 * Example: safeShellExec('docker run --rm -v {}:/data:ro alpine sh -lc "..." > {}', [volume, backupFile])
 */
export const safeShellExec = (template: string, args: (string | number)[]): Promise<{ stdout: string; stderr: string }> => {
  // Split on the literal placeholder and interleave quoted args. This avoids
  // String.replace (which both stops at the first match and interprets `$&`
  // patterns in the replacement) and the previous `:` placeholder, which
  // collided with the colons that are part of Docker's own mount syntax —
  // a substituted value containing `:` would shift every later argument into
  // the wrong slot.
  const parts = template.split('{}');
  const slots = parts.length - 1;
  if (slots !== args.length) {
    throw new Error(`safeShellExec: template expects ${slots} argument(s) but received ${args.length}`);
  }

  let finalCommand = parts[0];
  args.forEach((arg, i) => {
    finalCommand += quote([String(arg)]) + parts[i + 1];
  });

  return runCommand('sh', ['-c', finalCommand]);
};

/**
 * Standard patterns for Agentbot's common shell needs
 */
export const SecureExec = {
  /**
   * Safe Docker backup command pattern
   */
  dockerBackup: (volumeName: string, backupFile: string) => {
    return safeShellExec(
      'docker run --rm -v {}:/data:ro alpine sh -lc "tar czf - -C /data ." > {}',
      [volumeName, backupFile]
    );
  },

  /**
   * Safe OpenClaw config injection pattern
   */
  provisionConfig: (volumeName: string, configBase64: string) => {
    return safeShellExec(
      'docker run --rm -e OPENCLAW_CONFIG_B64={} -v {}:/target alpine sh -lc "mkdir -p /target/agents /target/workspace /target/logs /target/canvas /target/cron && echo \\$OPENCLAW_CONFIG_B64 | base64 -d > /target/openclaw.json && chmod -R 777 /target"',
      [configBase64, volumeName]
    );
  }
};
