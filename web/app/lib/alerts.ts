/**
 * alerts.ts — Webhook alerting for critical events
 *
 * Sends fire-and-forget notifications to Slack and/or Discord.
 * Configure via env vars:
 *   SLACK_WEBHOOK_URL  — Slack Incoming Webhook URL
 *   DISCORD_WEBHOOK_URL — Discord channel webhook URL
 *   ALERT_ENV           — label shown in alerts (default: "production")
 */

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface AlertPayload {
  title: string
  message: string
  severity: AlertSeverity
  fields?: Record<string, string>
}

const ENV_LABEL = process.env.ALERT_ENV || 'production'

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: '🟢',
  warning: '🟡',
  critical: '🔴',
}

const SEVERITY_COLOR: Record<AlertSeverity, number> = {
  info: 0x2eb886,    // green
  warning: 0xe3a117, // yellow
  critical: 0xe01e5a, // red
}

/** Fire-and-forget — never throws, never blocks the caller */
export async function sendAlert(payload: AlertPayload): Promise<void> {
  const slackUrl = process.env.SLACK_WEBHOOK_URL
  const discordUrl = process.env.DISCORD_WEBHOOK_URL

  if (!slackUrl && !discordUrl) return // no-op if not configured

  const emoji = SEVERITY_EMOJI[payload.severity]
  const timestamp = new Date().toISOString()

  const sends: Promise<void>[] = []

  if (slackUrl) {
    sends.push(sendSlack(slackUrl, payload, emoji, timestamp))
  }
  if (discordUrl) {
    sends.push(sendDiscord(discordUrl, payload, emoji, timestamp))
  }

  // Fire-and-forget — await in parallel, swallow errors
  await Promise.allSettled(sends)
}

async function sendSlack(
  url: string,
  payload: AlertPayload,
  emoji: string,
  timestamp: string
): Promise<void> {
  const fields = payload.fields
    ? Object.entries(payload.fields).map(([title, value]) => ({
        type: 'mrkdwn',
        text: `*${title}*\n${value}`,
      }))
    : []

  const body = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${payload.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: payload.message },
      },
      ...(fields.length > 0
        ? [{ type: 'section', fields }]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Env:* ${ENV_LABEL} | *Time:* ${timestamp}`,
          },
        ],
      },
    ],
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function sendDiscord(
  url: string,
  payload: AlertPayload,
  emoji: string,
  timestamp: string
): Promise<void> {
  const fields = payload.fields
    ? Object.entries(payload.fields).map(([name, value]) => ({
        name,
        value: value.slice(0, 1024), // Discord field limit
        inline: true,
      }))
    : []

  const body = {
    embeds: [
      {
        title: `${emoji} ${payload.title}`,
        description: payload.message,
        color: SEVERITY_COLOR[payload.severity],
        fields,
        footer: { text: `${ENV_LABEL} • ${timestamp}` },
      },
    ],
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Pre-built alert helpers ──────────────────────────────────────────────────

export async function alertNewUser(email: string, method: string) {
  await sendAlert({
    title: 'New User Registered',
    message: `A new account was created on agentbot.`,
    severity: 'info',
    fields: { Email: email, Method: method },
  })
}

export async function alertNewProvision(userId: string, plan: string) {
  await sendAlert({
    title: 'Agent Provisioned',
    message: 'A new agent instance has been deployed.',
    severity: 'info',
    fields: { 'User ID': userId, Plan: plan },
  })
}

export async function alertStripeFailure(
  event: string,
  customerId: string,
  amount?: string
) {
  await sendAlert({
    title: 'Stripe Payment Failed',
    message: `A payment event requires attention.`,
    severity: 'warning',
    fields: {
      Event: event,
      Customer: customerId,
      ...(amount ? { Amount: amount } : {}),
    },
  })
}

export async function alertLoginBurst(ip: string, path: string, count: number) {
  await sendAlert({
    title: 'Login Burst Detected',
    message: `Repeated failed auth attempts — possible brute force.`,
    severity: 'warning',
    fields: { IP: ip, Path: path, Attempts: String(count) },
  })
}

export async function alertSecurityEvent(
  type: string,
  ip: string,
  path: string,
  detail: string
) {
  await sendAlert({
    title: `Security Event: ${type}`,
    message: detail,
    severity: 'critical',
    fields: { IP: ip, Path: path },
  })
}
