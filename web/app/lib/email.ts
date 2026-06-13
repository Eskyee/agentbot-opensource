import { Resend } from 'resend';
import { render } from '@react-email/render';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log('Resend not configured, skipping email:', { to, subject });
    return { success: false, error: 'Resend not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: 'Agentbot <noreply@agentbot.sh>',
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

// ─── Card Email Sender (React Email) ────────────────────────────────────────
export async function sendCardEmail({
  to,
  subject,
  component,
}: {
  to: string;
  subject: string;
  component: React.ReactElement;
}) {
  const html = await render(component);
  return sendEmail({ to, subject, html });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const { welcomeEmail } = await import('@/lib/email/templates')
  const { subject, html } = welcomeEmail(name)
  return sendEmail({ to: email, subject, html })
}

export async function sendAgentDeployedEmail(email: string, name: string, plan: string, agentUrl: string) {
  const { agentDeployedEmail } = await import('@/lib/email/templates')
  const { subject, html } = agentDeployedEmail(name, plan, agentUrl)
  return sendEmail({ to: email, subject, html })
}

export async function sendPlanUpgradedEmail(email: string, name: string, oldPlan: string, newPlan: string) {
  const { planUpgradedEmail } = await import('@/lib/email/templates')
  const { subject, html } = planUpgradedEmail(name, oldPlan, newPlan)
  return sendEmail({ to: email, subject, html })
}

export async function sendWeeklyDigestEmail(email: string, name: string, stats: { messagesProcessed: number; tasksCompleted: number; uptime: string }) {
  const { weeklyDigestEmail } = await import('@/lib/email/templates')
  const { subject, html } = weeklyDigestEmail(name, stats)
  return sendEmail({ to: email, subject, html })
}

export async function sendPaymentReceiptEmail(
  email: string,
  amount: number,
  plan: string
) {
  const { layout, BRAND } = await import('@/lib/email/templates')
  return sendEmail({
    to: email,
    subject: `Payment received — ${plan} plan`,
    html: layout(`
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 24px;">
        Payment confirmed.
      </p>
      <div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        <table width="100%" style="font-size:13px;">
          <tr>
            <td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">Amount</td>
            <td style="padding:6px 0;color:#fff;font-weight:700;text-align:right;">£${(amount / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">Plan</td>
            <td style="padding:6px 0;color:#fff;text-transform:capitalize;text-align:right;">${plan}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;">Status</td>
            <td style="padding:6px 0;color:#22c55e;font-weight:700;text-align:right;">Active</td>
          </tr>
        </table>
      </div>
      <p style="font-size:13px;color:#888;margin:0;">
        &mdash; ${BRAND.name}
      </p>
    `),
  });
}

// ─── Card Email Functions (React Email) ─────────────────────────────────────
export async function sendWelcomeCardEmail(email: string, name: string) {
  const { WelcomeCard } = await import('@/lib/email/card-templates')
  return sendCardEmail({
    to: email,
    subject: 'Your agent is live — here\'s what to do first',
    component: WelcomeCard({ name }),
  })
}

export async function sendAgentDeployedCardEmail(email: string, name: string, plan: string, agentUrl: string) {
  const { AgentDeployedCard } = await import('@/lib/email/card-templates')
  return sendCardEmail({
    to: email,
    subject: `Your ${plan} agent is live`,
    component: AgentDeployedCard({ name, plan, agentUrl }),
  })
}

export async function sendPlanUpgradedCardEmail(email: string, name: string, oldPlan: string, newPlan: string) {
  const { PlanUpgradedCard } = await import('@/lib/email/card-templates')
  return sendCardEmail({
    to: email,
    subject: `Upgraded to ${newPlan} — more power unlocked`,
    component: PlanUpgradedCard({ name, oldPlan, newPlan }),
  })
}

export async function sendWeeklyDigestCardEmail(email: string, name: string, stats: { messagesProcessed: number; tasksCompleted: number; uptime: string }) {
  const { WeeklyDigestCard } = await import('@/lib/email/card-templates')
  return sendCardEmail({
    to: email,
    subject: `Your agent this week — ${stats.tasksCompleted} tasks completed`,
    component: WeeklyDigestCard({ name, stats }),
  })
}

export async function sendPaymentReceiptCardEmail(email: string, amount: number, plan: string) {
  const { PaymentReceiptCard } = await import('@/lib/email/card-templates')
  return sendCardEmail({
    to: email,
    subject: `Payment received — ${plan} plan`,
    component: PaymentReceiptCard({ amount, plan }),
  })
}
