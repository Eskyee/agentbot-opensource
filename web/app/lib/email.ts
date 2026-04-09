import { Resend } from 'resend';

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
      from: 'Agentbot <noreply@agentbot.raveculture.xyz>',
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
  return sendEmail({
    to: email,
    subject: `Payment received for ${plan} plan`,
    html: `
      <h1>Payment Confirmation</h1>
      <p>Thank you for your payment!</p>
      <ul>
        <li><strong>Amount:</strong> £${(amount / 100).toFixed(2)}</li>
        <li><strong>Plan:</strong> ${plan}</li>
      </ul>
      <p>Your subscription is now active.</p>
      <hr />
      <p>Best,<br>The Agentbot Team</p>
    `,
  });
}
