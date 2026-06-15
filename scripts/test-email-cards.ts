// Test script — send all 5 card email templates to djescaba@icloud.com
// Run: npx tsx scripts/test-email-cards.ts

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const TO = 'djescaba@icloud.com'
const FROM = 'Agentbot <onboarding@resend.dev>'

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY not set')
  process.exit(1)
}

const resend = new Resend(RESEND_API_KEY)

// ─── Welcome Card ───────────────────────────────────────────────────────────
const WELCOME_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
<div style="max-width:600px;margin:40px auto;background:#0a0a0a;border:1px solid #222;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">🦞</div>
    <h1 style="color:#fff;font-size:24px;margin:0;">Welcome to Agentbot</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#fff;font-size:16px;margin:0 0 16px;">Hey DjEscaba,</p>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px;">Your agent is live. Here's what to do first:</p>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:0 0 16px;">
      <div style="color:#10b981;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">Step 1</div>
      <div style="color:#fff;font-size:14px;margin-top:4px;">Connect your API keys in Settings</div>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:0 0 16px;">
      <div style="color:#10b981;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">Step 2</div>
      <div style="color:#fff;font-size:14px;margin-top:4px;">Deploy your first agent</div>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:0 0 24px;">
      <div style="color:#10b981;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">Step 3</div>
      <div style="color:#fff;font-size:14px;margin-top:4px;">Join the community on Discord</div>
    </div>
    <a href="https://agentbot.sh/dashboard" style="display:block;background:#10b981;color:#000;text-align:center;padding:14px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:14px;">Open Dashboard →</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">© 2026 Agentbot · Zero Human Company</p>
  </div>
</div>
</body></html>`

// ─── Agent Deployed Card ────────────────────────────────────────────────────
const AGENT_DEPLOYED_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
<div style="max-width:600px;margin:40px auto;background:#0a0a0a;border:1px solid #222;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">🤖</div>
    <h1 style="color:#fff;font-size:24px;margin:0;">Agent Deployed</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#fff;font-size:16px;margin:0 0 16px;">Hey DjEscaba,</p>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px;">Your Collective agent is live and running.</p>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:0 0 24px;">
      <div style="display:flex;justify-content:space-between;margin:0 0 8px;">
        <span style="color:#888;font-size:12px;">Plan</span>
        <span style="color:#3b82f6;font-size:12px;font-weight:bold;">Collective</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin:0 0 8px;">
        <span style="color:#888;font-size:12px;">Status</span>
        <span style="color:#10b981;font-size:12px;font-weight:bold;">● Running</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:#888;font-size:12px;">URL</span>
        <span style="color:#fff;font-size:12px;">agentbot.sh/agent/dj-escaba</span>
      </div>
    </div>
    <a href="https://agentbot.sh/dashboard" style="display:block;background:#3b82f6;color:#fff;text-align:center;padding:14px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:14px;">View Agent →</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">© 2026 Agentbot · Zero Human Company</p>
  </div>
</div>
</body></html>`

// ─── Plan Upgraded Card ─────────────────────────────────────────────────────
const PLAN_UPGRADED_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
<div style="max-width:600px;margin:40px auto;background:#0a0a0a;border:1px solid #222;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#a855f7,#7c3aed);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">⚡</div>
    <h1 style="color:#fff;font-size:24px;margin:0;">Upgraded to Label</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#fff;font-size:16px;margin:0 0 16px;">Hey DjEscaba,</p>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px;">You've been upgraded from Collective to Label. More power unlocked.</p>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:0 0 24px;">
      <div style="display:flex;justify-content:space-between;margin:0 0 8px;">
        <span style="color:#888;font-size:12px;">Previous</span>
        <span style="color:#666;font-size:12px;">Collective</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin:0 0 8px;">
        <span style="color:#888;font-size:12px;">Current</span>
        <span style="color:#a855f7;font-size:12px;font-weight:bold;">Label</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:#888;font-size:12px;">New Features</span>
        <span style="color:#10b981;font-size:12px;">Priority support, 50GB storage</span>
      </div>
    </div>
    <a href="https://agentbot.sh/dashboard" style="display:block;background:#a855f7;color:#fff;text-align:center;padding:14px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:14px;">View Dashboard →</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">© 2026 Agentbot · Zero Human Company</p>
  </div>
</div>
</body></html>`

// ─── Weekly Digest Card ─────────────────────────────────────────────────────
const WEEKLY_DIGEST_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
<div style="max-width:600px;margin:40px auto;background:#0a0a0a;border:1px solid #222;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">📊</div>
    <h1 style="color:#fff;font-size:24px;margin:0;">Weekly Digest</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#fff;font-size:16px;margin:0 0 16px;">Hey DjEscaba,</p>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px;">Here's what your agent did this week.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:0 0 24px;">
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;">
        <div style="color:#f59e0b;font-size:28px;font-weight:bold;">247</div>
        <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Messages</div>
      </div>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;">
        <div style="color:#10b981;font-size:28px;font-weight:bold;">18</div>
        <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Tasks Done</div>
      </div>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;">
        <div style="color:#3b82f6;font-size:28px;font-weight:bold;">99.9%</div>
        <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Uptime</div>
      </div>
    </div>
    <a href="https://agentbot.sh/dashboard" style="display:block;background:#f59e0b;color:#000;text-align:center;padding:14px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:14px;">View Full Report →</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">© 2026 Agentbot · Zero Human Company</p>
  </div>
</div>
</body></html>`

// ─── Payment Receipt Card ───────────────────────────────────────────────────
const PAYMENT_RECEIPT_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
<div style="max-width:600px;margin:40px auto;background:#0a0a0a;border:1px solid #222;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">💳</div>
    <h1 style="color:#fff;font-size:24px;margin:0;">Payment Received</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#fff;font-size:16px;margin:0 0 16px;">Hey DjEscaba,</p>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px;">Your payment for the Label plan has been processed.</p>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:0 0 24px;">
      <div style="display:flex;justify-content:space-between;margin:0 0 8px;">
        <span style="color:#888;font-size:12px;">Plan</span>
        <span style="color:#fff;font-size:12px;font-weight:bold;">Label</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin:0 0 8px;">
        <span style="color:#888;font-size:12px;">Amount</span>
        <span style="color:#10b981;font-size:12px;font-weight:bold;">$49.00</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:#888;font-size:12px;">Date</span>
        <span style="color:#fff;font-size:12px;">Jun 11, 2026</span>
      </div>
    </div>
    <a href="https://agentbot.sh/dashboard" style="display:block;background:#10b981;color:#000;text-align:center;padding:14px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:14px;">View Receipt →</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">© 2026 Agentbot · Zero Human Company</p>
  </div>
</div>
</body></html>`

async function sendAll() {
  const cards = [
    { name: 'Welcome', html: WELCOME_HTML, subject: '🦞 Welcome to Agentbot — your agent is live' },
    { name: 'Agent Deployed', html: AGENT_DEPLOYED_HTML, subject: '🤖 Your Collective agent is live' },
    { name: 'Plan Upgraded', html: PLAN_UPGRADED_HTML, subject: '⚡ Upgraded to Label — more power unlocked' },
    { name: 'Weekly Digest', html: WEEKLY_DIGEST_HTML, subject: '📊 Weekly Digest — 18 tasks completed' },
    { name: 'Payment Receipt', html: PAYMENT_RECEIPT_HTML, subject: '💳 Payment received — Label plan' },
  ]

  for (const card of cards) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: TO,
        subject: card.subject,
        html: card.html,
      })
      if (error) {
        console.error(`❌ ${card.name}:`, error)
      } else {
        console.log(`✅ ${card.name}: sent (${data?.id})`)
      }
    } catch (err) {
      console.error(`❌ ${card.name}:`, err)
    }
  }
}

sendAll()
