// Canonical welcome email sender — delegates to the unified email module.
// Kept as a re-export so existing imports from '@/lib/email/welcome' still work.
export { sendWelcomeEmail } from '@/app/lib/email'
