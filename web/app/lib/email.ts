import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send')
    return
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@agentbot.raveculture.xyz',
      to,
      subject,
      html,
    })

    if (result.error) {
      console.error('Failed to send email:', result.error)
      throw result.error
    }

    console.log(`Email sent to ${to}:`, result.data?.id)
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendPaymentReceiptEmail(
  to: string,
  amount: number,
  plan: string
): Promise<void> {
  const formattedAmount = (amount / 100).toFixed(2)
  const planName = typeof plan === 'string' ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Plan'
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .plan-details { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { font-weight: 700; color: #333; }
          .price { font-size: 24px; color: #3b82f6; margin: 10px 0; }
          .cta { text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .button:hover { background: #2563eb; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Received</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for upgrading!</p>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>Your payment has been successfully processed. Your ${planName} plan is now active.</p>
            
            <div class="plan-details">
              <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${planName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">£${formattedAmount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <p>Your service is now being deployed. This typically takes 30-60 seconds.</p>

            <div class="cta">
              <a href="https://agentbot.raveculture.xyz/dashboard" class="button">Access Your Dashboard</a>
            </div>

            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact our support team at support@agentbot.com
            </p>

            <div class="footer">
              <p>AgentBot • Powering AI Agents for Everyone</p>
              <p><a href="https://agentbot.raveculture.xyz" style="color: #3b82f6; text-decoration: none;">agentbot.raveculture.xyz</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to,
    subject: `AgentBot Payment Receipt - ${planName} Plan`,
    html,
    text: `Payment received for ${planName} plan (£${formattedAmount}). Access your dashboard: https://agentbot.raveculture.xyz/dashboard`
  })
}

export async function sendSubscriptionConfirmationEmail(
  to: string,
  plan: string
): Promise<void> {
  const planName = typeof plan === 'string' ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Plan'
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .cta { text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .button:hover { background: #2563eb; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Welcome to AgentBot!</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>Your subscription to the ${planName} plan has been confirmed and is now active!</p>
            
            <p>You can now:</p>
            <ul>
              <li>Deploy AI agents with our platform</li>
              <li>Configure Telegram and WhatsApp channels</li>
              <li>Access advanced analytics</li>
              <li>Get priority support</li>
            </ul>

            <div class="cta">
              <a href="https://agentbot.raveculture.xyz/dashboard" class="button">Go to Dashboard</a>
            </div>

            <p style="color: #666; font-size: 14px;">
              Questions? Check out our <a href="https://agentbot.raveculture.xyz/docs" style="color: #3b82f6;">documentation</a> or contact support at support@agentbot.com
            </p>

            <div class="footer">
              <p>AgentBot • Powering AI Agents for Everyone</p>
              <p><a href="https://agentbot.raveculture.xyz" style="color: #3b82f6; text-decoration: none;">agentbot.raveculture.xyz</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to,
    subject: `Welcome to AgentBot ${planName} Plan!`,
    html,
    text: `Your ${planName} subscription is active. Get started: https://agentbot.raveculture.xyz/dashboard`
  })
}

export async function sendSubscriptionCancelledEmail(
  to: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f3f4f6; color: #333; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; border: 1px solid #e5e7eb; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .cta { text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .button:hover { background: #2563eb; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>Your AgentBot subscription has been cancelled. Your access will remain active until the end of your billing period.</p>
            
            <p>We'd love to have you back! If you have feedback or concerns, please let us know at support@agentbot.com</p>

            <div class="cta">
              <a href="https://agentbot.raveculture.xyz/pricing" class="button">View Our Plans</a>
            </div>

            <div class="footer">
              <p>AgentBot • Powering AI Agents for Everyone</p>
              <p><a href="https://agentbot.raveculture.xyz" style="color: #3b82f6; text-decoration: none;">agentbot.raveculture.xyz</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to,
    subject: 'Your AgentBot Subscription Has Been Cancelled',
    html,
    text: 'Your subscription has been cancelled. We\'d love to have you back: https://agentbot.raveculture.xyz/pricing'
  })
}

export async function sendWelcomeEmail(
  to: string,
  name: string = 'there'
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .cta { text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .button:hover { background: #2563eb; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to AgentBot!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been created successfully. You're ready to start building AI agents!</p>
            
            <p>Next steps:</p>
            <ul>
              <li>Choose your subscription plan</li>
              <li>Configure your AI agent</li>
              <li>Deploy and go live</li>
            </ul>

            <div class="cta">
              <a href="https://agentbot.raveculture.xyz/dashboard" class="button">Go to Dashboard</a>
            </div>

            <p style="color: #666; font-size: 14px;">
              Need help? Check out our <a href="https://agentbot.raveculture.xyz/docs" style="color: #3b82f6;">documentation</a> or contact support at support@agentbot.com
            </p>

            <div class="footer">
              <p>AgentBot • Powering AI Agents for Everyone</p>
              <p><a href="https://agentbot.raveculture.xyz" style="color: #3b82f6; text-decoration: none;">agentbot.raveculture.xyz</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to,
    subject: 'Welcome to AgentBot!',
    html,
    text: `Welcome to AgentBot! Get started: https://agentbot.raveculture.xyz/dashboard`
  })
}
