import { spawn } from 'child_process';

/**
 * Executes a command with arguments using child_process.spawn.
 * Mitigates shell injection by avoiding the shell entirely.
 */
export const runCommand = (cmd: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Command failed with exit code ${code}`));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Helper to run complex shell commands (pipes, redirects) securely.
 * Still uses a shell but encapsulates the sh -c pattern.
 */
export const runShellCommand = (shellCommand: string): Promise<{ stdout: string; stderr: string }> => {
  return runCommand('sh', ['-c', shellCommand]);
};
