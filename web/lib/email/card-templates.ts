import { buildAppUrl } from '@/app/lib/app-url'

const BRAND = {
  name: 'Agentbot',
  from: 'Agentbot <noreply@agentbot.sh>',
  logo: '🦞',
  url: 'https://agentbot.sh',
  support: 'rbasefm@icloud.com',
  discord: 'https://discord.gg/n5zvYRnCDF',
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'SF Mono',SFMono-Regular,Menlo,Consolas,monospace;background:#000;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1a1a1a;">
        <tr><td style="padding:32px 40px 0;border-bottom:1px solid #1a1a1a;">
          <table width="100%"><tr>
            <td style="font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#fff;padding-bottom:24px;">
              ${BRAND.logo} AGENTBOT
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">
            <a href="${BRAND.url}" style="color:#555;text-decoration:none;">agentbot.sh</a>
            &nbsp;&middot;&nbsp;
            <a href="${BRAND.discord}" style="color:#555;text-decoration:none;">Discord</a>
            &nbsp;&middot;&nbsp;
            <a href="${buildAppUrl('/blog')}" style="color:#555;text-decoration:none;">Blog</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#fff;color:#000;padding:14px 28px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;text-decoration:none;margin:8px 0;">${text}</a>`
}

function statRow(label: string, value: string, color: string = '#fff'): string {
  return `<tr><td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">${label}</td><td style="padding:6px 0;color:${color};font-weight:700;text-align:right;">${value}</td></tr>`
}

// ─── Welcome Card ───────────────────────────────────────────────────────────
export function welcomeCard(name: string): { subject: string; html: string } {
  return {
    subject: 'Your agent is live — here\'s what to do first',
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Hey ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Welcome to Agentbot. Your agent is already being provisioned — running 24/7 on a secure server.</p>

      <table width="100%" style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        ${statRow('Status', 'Running', '#22c55e')}
        ${statRow('Plan', 'Active')}
        ${statRow('Uptime', '24/7', '#22c55e')}
      </table>

      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 8px;"><strong style="color:#fff;">Give your agent one real task</strong> — something you do manually today.</p>

      ${btn('Open Dashboard', buildAppUrl('/dashboard'))}

      <p style="font-size:13px;color:#888;margin:32px 0 0;">&mdash; The Agentbot Team</p>
    `),
  }
}

// ─── Agent Deployed Card ────────────────────────────────────────────────────
export function agentDeployedCard(name: string, plan: string, agentUrl: string): { subject: string; html: string } {
  return {
    subject: `Your ${plan} agent is live`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Hey ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Your <strong style="color:#fff;">${plan}</strong> agent just finished deploying.</p>

      <table width="100%" style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        ${statRow('Status', 'Running', '#22c55e')}
        ${statRow('Plan', plan)}
        <tr><td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">URL</td><td style="padding:6px 0;"><a href="${agentUrl}" style="color:#8b5cf6;text-decoration:none;word-break:break-all;font-size:13px;">${agentUrl}</a></td></tr>
      </table>

      <p style="font-size:14px;line-height:2;color:#999;margin:0 0 24px;">1. Open dashboard and connect to OpenClaw<br>2. Give your agent its first task<br>3. Connect Telegram or Discord</p>

      ${btn('Open Dashboard', buildAppUrl('/dashboard'))}

      <p style="font-size:13px;color:#888;margin:32px 0 0;">&mdash; The Agentbot Team</p>
    `),
  }
}

// ─── Plan Upgraded Card ─────────────────────────────────────────────────────
export function planUpgradedCard(name: string, oldPlan: string, newPlan: string): { subject: string; html: string } {
  return {
    subject: `Upgraded to ${newPlan} — more power unlocked`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Hey ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Your plan has been upgraded. Your agent container is being resized now.</p>

      <table width="100%" style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;text-align:center;">
        <tr><td style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">
          ${oldPlan} <span style="font-size:18px;color:#fff;margin:0 16px;">→</span> <span style="color:#22c55e;font-weight:700;">${newPlan}</span>
        </td></tr>
      </table>

      ${btn('View Dashboard', buildAppUrl('/dashboard'))}

      <p style="font-size:13px;color:#888;margin:32px 0 0;">&mdash; The Agentbot Team</p>
    `),
  }
}

// ─── Weekly Digest Card ─────────────────────────────────────────────────────
export function weeklyDigestCard(name: string, stats: {
  messagesProcessed: number
  tasksCompleted: number
  uptime: string
}): { subject: string; html: string } {
  return {
    subject: `Your agent this week — ${stats.tasksCompleted} tasks completed`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Hey ${name}, here's what your agent did this week:</p>

      <table width="100%" style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        <tr>
          <td style="padding:12px;text-align:center;border-right:1px solid #222;">
            <div style="font-size:28px;font-weight:700;color:#fff;">${stats.messagesProcessed}</div>
            <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Messages</div>
          </td>
          <td style="padding:12px;text-align:center;border-right:1px solid #222;">
            <div style="font-size:28px;font-weight:700;color:#fff;">${stats.tasksCompleted}</div>
            <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Tasks Done</div>
          </td>
          <td style="padding:12px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#22c55e;">${stats.uptime}</div>
            <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Uptime</div>
          </td>
        </tr>
      </table>

      ${btn('View Full Dashboard', buildAppUrl('/dashboard'))}

      <p style="font-size:13px;color:#888;margin:32px 0 0;">&mdash; The Agentbot Team</p>
    `),
  }
}

// ─── Payment Receipt Card ───────────────────────────────────────────────────
export function paymentReceiptCard(amount: number, plan: string): { subject: string; html: string } {
  return {
    subject: `Payment received — ${plan} plan`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">Payment confirmed.</p>

      <table width="100%" style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        ${statRow('Amount', `£${(amount / 100).toFixed(2)}`)}
        ${statRow('Plan', plan)}
        ${statRow('Status', 'Active', '#22c55e')}
      </table>

      <p style="font-size:13px;color:#888;margin:0;">&mdash; ${BRAND.name}</p>
    `),
  }
}

export { BRAND, layout }
