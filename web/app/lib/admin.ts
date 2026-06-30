function parseEmails(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

// Admin grants are env-driven so they can be added/revoked without a redeploy
// and so personal addresses are not baked into source control.
// Set ADMIN_EMAILS (and/or OPERATOR_ADMIN_EMAILS) to a comma-separated list.
const ADMIN_EMAILS = Array.from(
  new Set([
    ...parseEmails(process.env.ADMIN_EMAILS),
    ...parseEmails(process.env.OPERATOR_ADMIN_EMAILS),
  ])
)

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
