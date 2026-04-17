import { buildAppUrl } from '@/app/lib/app-url'

const BRAND = {
  name: 'Agentbot',
  from: 'Agentbot <noreply@raveculture.space>',
  logo: '🦞',
  url: 'https://agentbot.sh',
  support: 'YOUR_ADMIN_EMAIL_2',
  discord: 'https://discord.gg/vTPG4vdV6D',
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

function storyCard(name: string, role: string, story: string): string {
  return `<div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:12px;">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#fff;">${name}, <span style="color:#888;font-weight:400;">${role}</span></p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#999;">${story}</p>
</div>`
}

// ---------------------------------------------------------------------------
// WELCOME EMAIL — sent on signup
// ---------------------------------------------------------------------------
export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Your agent is live — here\'s what to do first',
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Hey ${name},
      </p>
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Welcome to Agentbot. While you're reading this, your agent is already being provisioned &mdash;
        running 24/7 on a secure server, waiting for its first task.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 32px;">
        Agentbot isn't a chatbot. It's an assistant that does things on your behalf &mdash; even when
        you're not there. Here's what people have set theirs up to do this week:
      </p>

      ${storyCard('Emilie', 'label manager',
        'Her agent triages the A&R inbox every morning &mdash; flags priority demos, archives the noise, and preps a playlist brief before the Monday meeting.'
      )}
      ${storyCard('James', 'event promoter',
        'Every morning his agent checks the gig calendar, researches each venue, and drops a briefing doc with capacity, sound specs, and local contacts.'
      )}
      ${storyCard('Sarah', 'independent artist',
        'Runs a weekly royalty tracker every Monday at 8am. Late payment reminders go out to distributors automatically &mdash; without her lifting a finger.'
      )}

      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:32px 0 24px;">
        You have your plan active. The best way to start? <strong style="color:#fff;">Give your agent one real task</strong> &mdash;
        something you do manually today.
      </p>

      ${btn('Open Your Dashboard', buildAppUrl('/dashboard'))}

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1a1a1a;">
        <p style="font-size:13px;line-height:1.6;color:#888;margin:0 0 8px;">
          <strong style="color:#ccc;">Quick links:</strong>
        </p>
        <p style="font-size:13px;line-height:2;color:#888;margin:0;">
          <a href="${buildAppUrl('/documentation')}" style="color:#8b5cf6;text-decoration:none;">Documentation</a> &mdash; full setup guide<br>
          <a href="${buildAppUrl('/buddies')}" style="color:#8b5cf6;text-decoration:none;">Agentbot Babies</a> &mdash; hatch your first digital pet<br>
          <a href="${BRAND.discord}" style="color:#8b5cf6;text-decoration:none;">Discord</a> &mdash; ask questions, share builds
        </p>
      </div>

      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:32px 0 0;">
        Can't wait to see what you build,
      </p>
      <p style="font-size:13px;color:#888;margin:8px 0 0;">
        &mdash; The Agentbot Team
      </p>
    `),
  }
}

// ---------------------------------------------------------------------------
// AGENT DEPLOYED EMAIL — sent when container is live
// ---------------------------------------------------------------------------
export function agentDeployedEmail(name: string, plan: string, agentUrl: string): { subject: string; html: string } {
  return {
    subject: `Your ${plan} agent is live`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Hey ${name},
      </p>
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Your <strong style="color:#fff;">${plan}</strong> agent just finished deploying. It's live and ready to work.
      </p>

      <div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        <table width="100%" style="font-size:13px;color:#999;">
          <tr><td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">Status</td><td style="padding:6px 0;color:#22c55e;font-weight:700;">Running</td></tr>
          <tr><td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">Plan</td><td style="padding:6px 0;color:#fff;text-transform:capitalize;">${plan}</td></tr>
          <tr><td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">URL</td><td style="padding:6px 0;"><a href="${agentUrl}" style="color:#8b5cf6;text-decoration:none;word-break:break-all;">${agentUrl}</a></td></tr>
        </table>
      </div>

      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 8px;">
        <strong style="color:#fff;">What to do next:</strong>
      </p>
      <ol style="font-size:14px;line-height:2;color:#999;margin:0 0 24px;padding-left:20px;">
        <li>Open your dashboard and connect to OpenClaw</li>
        <li>Give your agent its first task &mdash; try "check my inbox" or "summarise this PDF"</li>
        <li>Connect Telegram or Discord for mobile access</li>
      </ol>

      ${btn('Open Dashboard', buildAppUrl('/dashboard'))}

      <p style="font-size:13px;color:#888;margin:32px 0 0;">
        Your agent runs 24/7. You can restart, update, or stop it anytime from the dashboard.
      </p>
      <p style="font-size:13px;color:#888;margin:8px 0 0;">
        &mdash; The Agentbot Team
      </p>
    `),
  }
}

// ---------------------------------------------------------------------------
// PLAN UPGRADED EMAIL
// ---------------------------------------------------------------------------
export function planUpgradedEmail(name: string, oldPlan: string, newPlan: string): { subject: string; html: string } {
  return {
    subject: `Upgraded to ${newPlan} — more power unlocked`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Hey ${name},
      </p>
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Your plan has been upgraded from <strong style="color:#888;">${oldPlan}</strong> to
        <strong style="color:#fff;">${newPlan}</strong>. Your agent container is being resized now &mdash;
        the extra resources will be live within a few minutes.
      </p>

      <div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;text-align:center;">
        <span style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">${oldPlan}</span>
        <span style="font-size:18px;color:#fff;margin:0 16px;">&rarr;</span>
        <span style="font-size:14px;color:#22c55e;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">${newPlan}</span>
      </div>

      ${btn('View Your Dashboard', buildAppUrl('/dashboard'))}

      <p style="font-size:13px;color:#888;margin:32px 0 0;">
        &mdash; The Agentbot Team
      </p>
    `),
  }
}

// ---------------------------------------------------------------------------
// WEEKLY DIGEST EMAIL
// ---------------------------------------------------------------------------
export function weeklyDigestEmail(name: string, stats: {
  messagesProcessed: number
  tasksCompleted: number
  uptime: string
}): { subject: string; html: string } {
  return {
    subject: `Your agent this week — ${stats.tasksCompleted} tasks completed`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Hey ${name}, here's what your agent did this week:
      </p>

      <div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        <table width="100%" style="font-size:13px;">
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
      </div>

      ${btn('View Full Dashboard', buildAppUrl('/dashboard'))}

      <p style="font-size:13px;color:#888;margin:32px 0 0;">
        &mdash; The Agentbot Team
      </p>
    `),
  }
}

export { BRAND }
