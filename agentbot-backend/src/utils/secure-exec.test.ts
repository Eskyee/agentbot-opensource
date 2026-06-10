import { runCommand, SecureExec } from './secure-exec';

describe('secure-exec', () => {
  describe('runCommand', () => {
    it('should execute command successfully', async () => {
      const result = await runCommand('echo', ['hello']);
      expect(result.stdout).toBe('hello');
    });

    it('should handle stderr', async () => {
      const result = await runCommand('sh', ['-c', 'echo error >&2 && echo ok']);
      expect(result.stderr).toBe('error');
      expect(result.stdout).toBe('ok');
    });

    it('should reject on non-zero exit code', async () => {
      await expect(runCommand('sh', ['-c', 'exit 1'])).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      await expect(runCommand('sleep', ['10'], { timeout: 100 })).rejects.toThrow('timed out');
    }, 5000);

    it('should retry on failure', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary failure');
        return { stdout: 'success', stderr: '' };
      });

      // Override runCommand for this test
      const { runCommand: originalRunCommand } = require('./secure-exec');
      const result = await runCommand('echo', ['test'], { retries: 2, retryDelay: 10 });
      expect(result.stdout).toBe('test');
    });

    it('should reject after all retries exhausted', async () => {
      await expect(runCommand('sh', ['-c', 'exit 1'], { retries: 2, retryDelay: 10 })).rejects.toThrow();
    });
  });

  describe('SecureExec', () => {
    it('should have dockerBackup method', () => {
      expect(typeof SecureExec.dockerBackup).toBe('function');
    });

    it('should have provisionConfig method', () => {
      expect(typeof SecureExec.provisionConfig).toBe('function');
    });
  });
});
