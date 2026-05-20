function parseEmails(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

const ADMIN_EMAILS = Array.from(
  new Set([
    'eskyjunglelab@gmail.com',
    'admin@agentbot.sh',
    'rbasefm@icloud.com',
    'djescaba@icloud.com',
    ...parseEmails(process.env.ADMIN_EMAILS),
    ...parseEmails(process.env.OPERATOR_ADMIN_EMAILS),
  ])
)

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
