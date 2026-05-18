/**
 * middleware/auth.js
 *
 * Cookie-based password auth for browser access to /admin and /setup.
 * API calls use Authorization: Bearer <token> header.
 *
 * Flow:
 *  - Browser hits /admin or /api/* without a valid cookie → redirect to /login
 *  - User submits password at /login → setAuthCookie() stores a random session
 *    token in the cookie (NEVER the password itself) and in a disk-backed map
 *  - API calls (fetch) include Authorization: Bearer <WRAPPER_ADMIN_PASSWORD>
 *    (compared with crypto.timingSafeEqual to avoid timing attacks)
 *
 * Hardening vs. previous version:
 *   1. Fail CLOSED when WRAPPER_ADMIN_PASSWORD is unset — previously any
 *      missing-env deploy made every endpoint publicly reachable.
 *   2. Cookie stores a random 32-byte session token, NOT the admin password.
 *      Previously the cookie leaked the password to anything that could read
 *      the Cookie header (proxies, logs, XSS).
 *   3. All password comparisons use crypto.timingSafeEqual with a length
 *      guard instead of `===`.
 *   4. Sessions persist to disk on the Railway volume so they survive gateway
 *      restarts, matching the project-wide "DB-backed state" preference
 *      (CLAUDE.md). The on-disk map is the authoritative store; the in-memory
 *      Map is just a cache hydrated at boot and refreshed on every mutation.
 */

import crypto from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { OPENCLAW_HOME, WRAPPER_ADMIN_PASSWORD } from '../config/index.js';

const COOKIE_NAME = 'ocw_admin';
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_SECONDS * 1000;

const SESSIONS_FILE = path.join(OPENCLAW_HOME, '.admin-sessions.json');

// Session store — hydrated from SESSIONS_FILE at module load, persisted on
// every mutation. Map<sessionToken, expiryMs>.
const activeSessions = new Map();

// Serialise writes so concurrent setAuthCookie / clearAuthCookie calls can't
// clobber each other mid-flight.
let persistChain = Promise.resolve();

function loadSessionsFromDisk() {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    const now = Date.now();
    for (const [token, expiresAt] of Object.entries(parsed)) {
      if (
        typeof token === 'string' &&
        /^[a-f0-9]{64}$/.test(token) &&
        typeof expiresAt === 'number' &&
        expiresAt > now
      ) {
        activeSessions.set(token, expiresAt);
      }
    }
  } catch (err) {
    // ENOENT on first boot is expected; anything else is best-effort.
    if (err && err.code !== 'ENOENT') {
      console.warn(
        `[auth] could not hydrate sessions from ${SESSIONS_FILE}: ${err.message}`
      );
    }
  }
}

async function writeSessionsToDisk() {
  try {
    await fsp.mkdir(OPENCLAW_HOME, { recursive: true });
    const payload = JSON.stringify(Object.fromEntries(activeSessions));
    const tmp = SESSIONS_FILE + '.tmp';
    await fsp.writeFile(tmp, payload, 'utf8');
    await fsp.rename(tmp, SESSIONS_FILE);
  } catch (err) {
    // Persistence is best-effort — a write failure should not break login.
    console.warn(
      `[auth] failed to persist sessions to ${SESSIONS_FILE}: ${err?.message || err}`
    );
  }
}

function persistSessions() {
  persistChain = persistChain.then(writeSessionsToDisk, writeSessionsToDisk);
  return persistChain;
}

loadSessionsFromDisk();

/**
 * Constant-time comparison that never throws on length mismatch.
 */
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function pruneExpiredSessions(now = Date.now()) {
  let pruned = false;
  for (const [token, expiresAt] of activeSessions) {
    if (expiresAt <= now) {
      activeSessions.delete(token);
      pruned = true;
    }
  }
  return pruned;
}

function isValidSessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const expiresAt = activeSessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    activeSessions.delete(token);
    persistSessions();
    return false;
  }
  return true;
}

// ── Cookie auth for browser navigation ───────────────────────────

export function requireAdminAuth(req, res, next) {
  // Fail CLOSED when the admin password is not configured. The old behaviour
  // ("if (!WRAPPER_ADMIN_PASSWORD) return next()") made every deploy with a
  // missing env var publicly writable.
  if (!WRAPPER_ADMIN_PASSWORD) {
    if (req.accepts('html')) {
      return res
        .status(503)
        .type('text/plain')
        .send(
          'WRAPPER_ADMIN_PASSWORD is not configured on this gateway. ' +
            'Set it in the environment and redeploy.'
        );
    }
    return res
      .status(503)
      .json({ ok: false, error: 'Gateway admin password not configured' });
  }

  // 1. Check Authorization header (API/fetch calls)
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (constantTimeEqual(token, WRAPPER_ADMIN_PASSWORD)) return next();
  }

  // 2. Check cookie (browser navigation)
  const cookies = parseCookies(req.headers.cookie || '');
  if (isValidSessionToken(cookies[COOKIE_NAME])) return next();

  // 3. Check x-admin-token header (legacy clients)
  const headerToken = (req.headers['x-admin-token'] || '').trim();
  if (constantTimeEqual(headerToken, WRAPPER_ADMIN_PASSWORD)) return next();

  // 4. Unauthorized — for browser requests redirect to login,
  //    for API/fetch requests return 401 JSON
  const isBrowserNav =
    !req.headers['authorization'] &&
    !req.headers['x-admin-token'] &&
    req.accepts('html');

  if (isBrowserNav) {
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?returnTo=${returnTo}`);
  }

  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

// ── Verify a submitted login password ─────────────────────────────

/**
 * Returns true iff the supplied password matches WRAPPER_ADMIN_PASSWORD.
 * Always constant-time; returns false if the env var is not configured.
 */
export function verifyAdminPassword(password) {
  if (!WRAPPER_ADMIN_PASSWORD) return false;
  if (typeof password !== 'string') return false;
  return constantTimeEqual(password, WRAPPER_ADMIN_PASSWORD);
}

// ── Set/clear auth cookie ─────────────────────────────────────────

/**
 * Issue a fresh, opaque session token and set it as an httpOnly cookie.
 * The password is intentionally NOT stored in the cookie — only a random
 * token that is recorded in the in-memory session map.
 *
 * Previous signature was setAuthCookie(res, password); the password arg is
 * now ignored but kept for backwards compatibility with existing callers.
 */
export function setAuthCookie(res, _unusedPassword) {
  pruneExpiredSessions();
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, Date.now() + COOKIE_MAX_AGE_MS);
  persistSessions();

  const secureAttr =
    process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secureAttr}`
  );
  return token;
}

export function clearAuthCookie(res) {
  // Invalidate server-side session if we can read the cookie.
  let mutated = false;
  try {
    const cookies = parseCookies(res.req?.headers?.cookie || '');
    const token = cookies[COOKIE_NAME];
    if (token && activeSessions.delete(token)) mutated = true;
  } catch {
    // Best-effort — fall through to clearing the cookie regardless.
  }
  if (mutated) persistSessions();

  const secureAttr =
    process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureAttr}`
  );
}

// ── Tiny cookie parser (no dep) ───────────────────────────────────

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach((part) => {
    const [k, ...v] = part.split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('=').trim());
  });
  return cookies;
}
