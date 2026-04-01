# Agentbot Platform Rules

## Instance Provisioning Policy

### Rule 1: Payment Required Before Instance Creation
- **No instance may be spun up for any user without prior payment via Stripe**
- The provision API must verify an active Stripe subscription before creating any service
- Users on free tier get NO compute instances (dashboard access only)

### Rule 2: Admin/Tester Exception
- Admin accounts (defined in env var `ADMIN_EMAILS`) bypass Stripe requirement
- Admin instances are billed internally, not to the user
- Tester accounts must be explicitly whitelisted in `TESTER_EMAILS` env var
- Admin and tester limits: max 1 agent, starter plan only

### Rule 3: Plan Enforcement
| Plan | Price | Agents | Stripe Required |
|------|-------|--------|-----------------|
| ~~free~~ | ~~£0~~ | ~~0~~ | ~~No~~ REMOVED |
| solo | £29/mo | 1 | Yes |
| collective | £69/mo | 3 | Yes |
| label | £149/mo | 10 | Yes |
| network | £499/mo | Unlimited | Yes |

**NO FREE TIER.** Every user must pay before accessing the platform. Dashboard access requires at least a solo plan.

### Rule 4: Provision Flow
1. User signs up → gets dashboard access (no instance)
2. User selects plan → Stripe checkout
3. Stripe webhook confirms payment → `subscription_active = true`
4. User clicks "Create Agent" → provision API checks:
   - Is subscription active?
   - Is plan limit reached?
   - If yes to both → spin up instance
5. If subscription lapses → suspend instance (don't delete)

### Rule 5: Cost Protection
- Max 1 instance per user on starter plan
- No autoscaling for user instances
- Admin must approve any service > starter plan
- Billing alerts at $35 unbilled threshold

### Rule 6: Emergency Kill Switch
- `KILL_SWITCH=true` env var disables ALL provisioning
- Admin can set this to stop new instances immediately
- Existing instances continue running

### Rule 7: Data Isolation (RLS)
- Every user's data is isolated via PostgreSQL Row-Level Security
- Users can ONLY see their own agents, tasks, memories, files
- Admin bypass: admin role sees all data
- RLS enforced at database level (not just application)
- Auth middleware sets user context before every query

---

## Admin Accounts

Admin accounts are configured via the `ADMIN_EMAILS` environment variable (comma-separated).
See your deployment's environment configuration — do not hardcode emails in source.

## Environment Variables Required

```
ADMIN_EMAILS=your-admin@example.com
TESTER_EMAILS=
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
KILL_SWITCH=false
```
