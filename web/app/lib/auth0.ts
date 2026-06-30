/**
 * Auth0 configuration for Agentbot.
 * Provides enterprise-grade authentication with:
 * - Automatic user provisioning
 * - Role-based access control
 * - Multi-environment sync
 * - Hosted login pages
 *
 * See: https://vercel.com/changelog/auth0-joins-the-vercel-marketplace
 */

export const AUTH0_ENABLED = !!(
  process.env.AUTH0_ISSUER_BASE_URL &&
  process.env.AUTH0_CLIENT_ID &&
  process.env.AUTH0_CLIENT_SECRET
);

/**
 * Auth0 environment variables needed:
 * - AUTH0_BASE_URL: Your app's base URL (e.g., https://agentbot.sh)
 * - AUTH0_ISSUER_BASE_URL: Auth0 domain (e.g., https://agentbot.auth0.com)
 * - AUTH0_CLIENT_ID: Auth0 application client ID
 * - AUTH0_CLIENT_SECRET: Auth0 application client secret
 * - AUTH0_SECRET: Session encryption key (generate with `openssl rand -base64 32`)
 * - AUTH0_REDIRECT_URI: Callback URL (e.g., https://agentbot.sh/api/auth/callback)
 */

export function getAuth0Config() {
  return {
    enabled: AUTH0_ENABLED,
    baseUrl: process.env.AUTH0_BASE_URL || process.env.NEXTAUTH_URL,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    clientId: process.env.AUTH0_CLIENT_ID,
  };
}
