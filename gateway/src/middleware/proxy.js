/**
 * middleware/proxy.js
 *
 * Reverse proxies all unmatched requests → http://127.0.0.1:18789
 *
 * openclaw's Control UI is designed to be served at root (/), so we
 * pass URLs through unmodified. Our own routes (/admin, /setup, /api,
 * /login, /ws) are registered first in server.js and never reach here.
 *
 * Only active when gateway is running. Returns 503 otherwise.
 */

import { GATEWAY_INTERNAL_URL } from '../config/index.js';
import { gatewayManager } from '../services/gatewayManager.js';

export function proxyMiddleware(req, res, next) {
  if (!gatewayManager.isRunning()) {
    // Don't 503 on GET / when not configured — let the redirect handler above handle it
    return next();
  }

  // Pass the full original URL through unchanged
  req.url = req.originalUrl;

  const proxy = gatewayManager.getHttpProxy();
  proxy.web(req, res, { target: GATEWAY_INTERNAL_URL });
}