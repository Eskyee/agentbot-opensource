/**
 * middleware/auth.js
 *
 * Cookie-based password auth for browser access to /admin and /setup.
 * API calls use Authorization: Bearer <token> header.
 *
 * Flow:
 *  - Browser hits /admin or /api/* without a valid cookie → redirect to /login
 *  - User submits password at /login → sets httpOnly cookie → redirect back
 *  - API calls (fetch) include Authorization: Bearer header
 *
 * If WRAPPER_ADMIN_PASSWORD is not set, all requests pass through.
 */

import { WRAPPER_ADMIN_PASSWORD } from '../config/index.js';

const COOKIE_NAME = 'ocw_admin';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ── Cookie auth for browser navigation ───────────────────────────

export function requireAdminAuth(req, res, next) {
  if (!WRAPPER_ADMIN_PASSWORD) return next();

  // 1. Check Authorization header (API/fetch calls)
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === WRAPPER_ADMIN_PASSWORD) return next();
  }

  // 2. Check cookie (browser navigation)
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies[COOKIE_NAME] === WRAPPER_ADMIN_PASSWORD) return next();

  // 3. Check x-admin-token header (legacy)
  const headerToken = (req.headers['x-admin-token'] || '').trim();
  if (headerToken === WRAPPER_ADMIN_PASSWORD) return next();

  // 4. Unauthorized — for browser requests redirect to login,
  //    for API/fetch requests return 401 JSON
  const isBrowserNav = !req.headers['authorization'] &&
                       !req.headers['x-admin-token'] &&
                       req.accepts('html');

  if (isBrowserNav) {
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?returnTo=${returnTo}`);
  }

  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

// ── Set/clear auth cookie ─────────────────────────────────────────

export function setAuthCookie(res, password) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${password}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`
  );
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
  );
}

// ── Tiny cookie parser (no dep) ───────────────────────────────────

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(part => {
    const [k, ...v] = part.split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('=').trim());
  });
  return cookies;
}