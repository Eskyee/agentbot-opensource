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
      from: 'Agentbot <noreply@raveculture.space>',
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
  return sendEmail({
    to: email,
    subject: 'Welcome to Agentbot!',
    html: `
      <h1>Welcome to Agentbot, ${name}!</h1>
      <p>Thanks for signing up. You can now deploy your first AI agent in 60 seconds.</p>
      <p>Get started at: <a href="https://agentbot.raveculture.xyz/onboard">https://agentbot.raveculture.xyz/onboard</a></p>
      <hr />
      <p>Best,<br>The Agentbot Team</p>
    `,
  });
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
