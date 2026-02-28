# Production Environment Variables

This document lists all environment variables that must be configured in **Vercel Dashboard → Settings → Environment Variables** for production deployments.

## Required Production Variables

### Authentication
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXTAUTH_SECRET` | ✅ Yes | Secret for NextAuth.js sessions | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ Yes | Production URL | `https://agentbot.raveculture.xyz` |
| `GOOGLE_CLIENT_ID` | ✅ Yes | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | Google OAuth Client Secret | From Google Cloud Console |
| `GITHUB_CLIENT_ID` | ✅ Yes | GitHub OAuth App Client ID | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | ✅ Yes | GitHub OAuth App Client Secret | From GitHub Developer Settings |

### Payments (Stripe)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | ✅ Yes | Stripe secret key (starts with `sk_live_`) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_ID_STARTER` | ✅ Yes | Stripe price ID for Starter plan | `price_...` |
| `STRIPE_PRICE_ID_PRO` | ✅ Yes | Stripe price ID for Pro plan | `price_...` |
| `STRIPE_PRICE_ID_PRO_PLUS` | ✅ Yes | Stripe price ID for Pro+ plan | `price_...` |
| `STRIPE_PRICE_ID_SCALE` | ✅ Yes | Stripe price ID for Scale plan | `price_...` |
| `STRIPE_PRICE_ID_WHITE_GLOVE` | ✅ Yes | Stripe price ID for White Glove plan | `price_...` |
| `STRIPE_PRICE_ID_TRIAL` | Optional | Stripe price ID for trial/credits | `price_...` |
| `STRIPE_PRICE_ID_DFY` | Optional | Stripe price ID for DFY service | `price_...` |

### Email
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RESEND_API_KEY` | Optional | Resend API key for transactional email | `re_...` |

### Backend Communication
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `INTERNAL_API_KEY` | ✅ Yes | API key for backend communication | Generate secure random string |
| `BACKEND_API_URL` | ✅ Yes | Production backend API URL | `https://agentbot-api.raveculture.xyz` |
| `BACKEND_API_FALLBACK_URL` | Optional | Fallback backend URL | `https://agentbot-api-fallback.raveculture.xyz` |

### Application URLs
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Production app URL | `https://agentbot.raveculture.xyz` |
| `ALLOWED_ORIGINS` | ✅ Yes | Allowed CORS origins (comma-separated) | `https://agentbot.raveculture.xyz` |
| `ALLOWED_AGENT_DOMAINS` | ✅ Yes | Allowed agent domains | `agents.agentbot.raveculture.xyz` |

### Database & Caching (if used by frontend)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Optional | Neon PostgreSQL connection string | `postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech/db` |
| `REDIS_URL` | Optional | Redis connection string | `redis://xxx.cache.amazonaws.com:6379` |

### AI & External Services
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key for AI features | `sk-or-v1-...` |
| `AI_GATEWAY_API_KEY` | Optional | AI Gateway API key | Your AI gateway key |
| `CDP_API_KEY_ID` | Optional | Coinbase Developer Platform API Key ID | From Coinbase Developer Portal |
| `CDP_API_KEY_SECRET` | Optional | Coinbase Developer Platform API Key Secret | From Coinbase Developer Portal |

---

## Environment Variable Setup Steps

### 1. Go to Vercel Dashboard
Navigate to: **Vercel → Your Project → Settings → Environment Variables**

### 2. Add Production Variables
Add each variable with the following settings:

| Scope | When to Use |
|-------|-------------|
| `Production` | For live production deployments |
| `Preview` | For preview deployments (PRs) |
| `Development` | For local development (optional) |

### 3. Recommended Order of Setup

1. **Authentication** - NEXTAUTH_SECRET, NEXTAUTH_URL, OAuth credentials
2. **Payments** - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, Price IDs
3. **Application URLs** - NEXT_PUBLIC_APP_URL, ALLOWED_ORIGINS
4. **Backend** - INTERNAL_API_KEY, BACKEND_API_URL
5. **Optional** - RESEND_API_KEY, AI keys, etc.

---

## Security Notes

### ⚠️ Important Security Recommendations

1. **Rotate INTERNAL_API_KEY** - The current value in `.env.frontend` is hardcoded. Generate a new one:
   ```bash
   openssl rand -base64 32
   ```

2. **Use Stripe Live Keys** - Ensure `STRIPE_SECRET_KEY` starts with `sk_live_` (not `sk_test_`)

3. **OAuth Credentials** - Verify Google and GitHub OAuth apps are configured for production:
   - Google: Add `https://agentbot.raveculture.xyz` to authorized redirect URIs
   - GitHub: Add `https://agentbot.raveculture.xyz/api/auth/callback/github` to authorization callback URL

4. **NEXTAUTH_SECRET** - Generate a new secure secret for production:
   ```bash
   openssl rand -base64 32
   ```

---

## Verification

After setting environment variables, verify by:
1. Deploy to production (push to main branch)
2. Check Vercel function logs for any environment variable errors
3. Test authentication (login with Google/GitHub)
4. Test Stripe checkout flow
5. Verify agent provisioning works

---

## Local Development

For local development, create a `.env.local` file in the `web/` directory with your local values. The `.env.frontend` file in the project root is for reference only and should not contain production secrets.
