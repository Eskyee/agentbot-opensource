/**
 * Graceful Shutdown Handler
 * SIGTERM/SIGINT handlers with 10-second drain timeout.
 * Closes DB connections, HTTP server.
 */

const SHUTDOWN_TIMEOUT_MS = 10_000; // 10 seconds

type CleanupFn = () => Promise<void>;

const cleanupFns: CleanupFn[] = [];
let isShuttingDown = false;

/**
 * Register a cleanup function to run on shutdown
 */
export function onShutdown(fn: CleanupFn): void {
  cleanupFns.push(fn);
}

/**
 * Check if the process is shutting down
 */
export function isShutdown(): boolean {
  return isShuttingDown;
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[shutdown] Received ${signal}, starting graceful shutdown...`);

  const timeout = setTimeout(() => {
    console.error('[shutdown] Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    // Run all cleanup functions in parallel
    await Promise.allSettled(cleanupFns.map((fn) => fn()));
    console.log('[shutdown] All cleanup complete');
  } catch (error) {
    console.error('[shutdown] Cleanup error:', error);
  }

  clearTimeout(timeout);
  process.exit(0);
}

/**
 * Initialize shutdown handlers. Call once at startup.
 */
export function initShutdownHandlers(): void {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Also handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[shutdown] Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[shutdown] Unhandled rejection:', reason);
  });

  console.log('[shutdown] Shutdown handlers registered');
}
