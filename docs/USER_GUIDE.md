# Agentbot User Guide

This guide is for customers using the Agentbot website.

Before production launch, run the [Production Release Checklist](PRODUCTION_RELEASE_CHECKLIST.md).

## 1) What You Need (before starting)

- A Telegram account
- A new bot token from @BotFather
- An AI API key (OpenRouter recommended for quick setup)

## 2) 60-Second Setup

All plans include a 3-day free trial. Deploy first, then upgrade to paid to keep your agent live.

1. Open the site: `https://agentbot.raveculture.xyz`
2. Choose a plan and continue to onboarding
3. Paste your Telegram bot token
4. Choose AI provider (OpenRouter recommended)
5. Paste your AI API key
6. Click **Deploy Now**

That’s it — your bot is deployed and ready to chat.

## 3) First Message Test

1. Open Telegram
2. Search your bot username (for example: `@ravedeployclawBot`)
3. Send: `hi` or `/start`
4. Expected result: the bot replies in a few seconds

## 4) Dashboard Basics

Open dashboard:

- `https://agentbot.raveculture.xyz/dashboard?id=<your-instance-id>`

You can:

- View current status
- Restart the instance
- Stop/start the instance
- Check basic usage stats

## 5) Platform Capabilities

### 📊 Monitor

Real-time analytics and performance tracking.

### 💰 Monetize

Revenue share model for creators.

### 🔗 Integrate

Connect with REST API and webhooks.

## 6) If Your Bot Does Not Reply

Try these in order:

1. Confirm bot token is correct in BotFather
2. Confirm AI API key is valid and active
3. Open dashboard and click **Restart**
4. Wait 10–20 seconds and send another message

If still no reply, check system health:

- Frontend: `https://agentbot.raveculture.xyz`
- API health: `https://api.agentbot.raveculture.xyz/health`

## 7) Common Errors

### “OpenClaw: access not configured”

- This means Telegram access policy blocked the sender.
- In current fast setup, new deployments default to open DM access.
- If this appears on an older instance, restart from dashboard or redeploy.

### “Invalid token” during onboarding

- Recreate token from @BotFather and paste again.

### “Internal server error” on deploy

- Usually API service issue or invalid provider key.
- Retry once, then verify `https://api.agentbot.raveculture.xyz/health`.

## 8) Security Best Practices

- Never share bot tokens or API keys in public chats
- Rotate credentials if accidentally exposed
- Use unique keys per bot/project when possible

## 9) Quick FAQ

### Do I need my Telegram user ID?

No. For fast setup, it is optional.

### How long does deployment take?

Usually under a minute.

### Can I change AI provider later?

Yes. Redeploy with a different provider/key.

## 10) Skills Registry (ClawHub)

ClawHub is a minimal skills registry.

Official site: https://theclawhub.com

When ClawHub is enabled, your agent can:

- Search for skills automatically
- Pull in new skills when needed

This helps your bot expand capabilities without manual server changes.

## 11) Chat Commands

You can send these commands in:

- WhatsApp
- Telegram
- Slack
- Google Chat
- Microsoft Teams
- WebChat

Group commands marked owner-only are restricted in group chats.

- `/status` — compact session status (model + tokens, cost when available)
- `/new` or `/reset` — reset the session
- `/compact` — compact session context (summary)
- `/think <level>` — `off|minimal|low|medium|high|xhigh` (GPT-5.2 + Codex models only)
- `/verbose on|off`
- `/usage off|tokens|full` — per-response usage footer
- `/restart` — restart the gateway (owner-only in groups)
- `/activation mention|always` — group activation toggle (groups only)
