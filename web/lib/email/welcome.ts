import { Resend } from 'resend';
import { APP_URL, buildAppUrl } from '@/app/lib/app-url'

export async function sendWelcomeEmail(email: string, name?: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const data = await resend.emails.send({
      from: 'Agentbot <noreply@raveculture.space>',
      to: [email],
      subject: 'Welcome to Agentbot 🦞',
      html: getWelcomeEmailHTML(name || email.split('@')[0]),
    });

    console.log('Welcome email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

function getWelcomeEmailHTML(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Agentbot</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111; border: 1px solid #222; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🦞</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #fff;">Welcome to Agentbot</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="font-size: 16px; line-height: 1.6; color: #999; margin: 0 0 24px;">
                Hey ${name},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #999; margin: 0 0 24px;">
                Welcome to Agentbot! You're now part of the underground culture movement building autonomous AI agents for collectives, events, and crypto-native communities.
              </p>

              <h2 style="font-size: 20px; font-weight: 600; color: #fff; margin: 32px 0 16px;">🚀 Get Started in 3 Steps</h2>

              <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fff;">1. Browse the Marketplace</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #999;">
                  Check out agent templates like Rave Event Agent, Community Treasury Agent, and more.
                </p>
                <a href="${buildAppUrl('/marketplace')}" style="display: inline-block; margin-top: 12px; color: #8b5cf6; text-decoration: none; font-weight: 600;">
                  View Marketplace →
                </a>
              </div>

              <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fff;">2. Deploy Your First Agent</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #999;">
                  Choose a template, customize it, and deploy to Telegram, Discord, or WhatsApp in under a minute.
                </p>
                <a href="${buildAppUrl('/dashboard')}" style="display: inline-block; margin-top: 12px; color: #8b5cf6; text-decoration: none; font-weight: 600;">
                  Go to Dashboard →
                </a>
              </div>

              <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fff;">3. Read the Docs</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #999;">
                  Learn how to create custom agents, add skills, and integrate with crypto wallets.
                </p>
                <a href="${buildAppUrl('/documentation')}" style="display: inline-block; margin-top: 12px; color: #8b5cf6; text-decoration: none; font-weight: 600;">
                  Read Docs →
                </a>
              </div>

              <h2 style="font-size: 20px; font-weight: 600; color: #fff; margin: 32px 0 16px;">🎧 What You Can Build</h2>

              <ul style="margin: 0 0 24px; padding-left: 20px; color: #999; font-size: 14px; line-height: 1.8;">
                <li><strong style="color: #fff;">Rave Event Agent:</strong> Manage guest lists, sell tickets in USDC, coordinate rides</li>
                <li><strong style="color: #fff;">Community Treasury:</strong> Track spending, process reimbursements, budget alerts</li>
                <li><strong style="color: #fff;">Crypto Wallet Agent:</strong> Send USDC, check balances, swap tokens on Base</li>
                <li><strong style="color: #fff;">Custom Agents:</strong> Build your own with custom skills and knowledge</li>
              </ul>

              <div style="background-color: #1a1a1a; border-left: 4px solid #8b5cf6; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #999;">
                  <strong style="color: #fff;">💡 Pro Tip:</strong> Start with the Rave Event Agent if you organize underground events, or the Community Treasury Agent if you manage collective funds.
                </p>
              </div>

              <h2 style="font-size: 20px; font-weight: 600; color: #fff; margin: 32px 0 16px;">Need Help?</h2>

              <p style="font-size: 14px; line-height: 1.6; color: #999; margin: 0 0 16px;">
                • <a href="${buildAppUrl('/documentation')}" style="color: #8b5cf6; text-decoration: none;">Documentation</a><br>
                • <a href="${buildAppUrl('/blog')}" style="color: #8b5cf6; text-decoration: none;">Blog & Tutorials</a><br>
                • Email: <a href="mailto:YOUR_ADMIN_EMAIL_2" style="color: #8b5cf6; text-decoration: none;">YOUR_ADMIN_EMAIL_2</a>
              </p>

              <p style="font-size: 16px; line-height: 1.6; color: #999; margin: 32px 0 0;">
                Let's build for the underground. 🎧
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 16px 0 0;">
                — The Agentbot Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0a0a0a; border-top: 1px solid #222; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                Built by ravers, for ravers. Autonomy over platforms. Always.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #666;">
                <a href="${APP_URL}" style="color: #8b5cf6; text-decoration: none;">agentbot.sh</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
