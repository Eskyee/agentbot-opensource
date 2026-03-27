---
name: add-telegram
description: Add Telegram bot channel to Agentbot. Use when user wants to connect Telegram as a messaging channel for their agent. Triggers on "add telegram", "telegram bot", "connect telegram", or "setup telegram".
---

# Add Telegram Channel

Guide user through setting up a Telegram bot for Agentbot.

## Step 1: Create Bot via @BotFather

Tell user to:
1. Open Telegram → Search `@BotFather`
2. Send `/newbot`
3. Follow instructions to name (e.g., "My Agent")
4. Get the bot token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

## Step 2: Configure Agentbot

Add token to backend `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

Or use the onboarding flow at `/onboard?mode=deploy`

## Step 3: Get Chat ID

Tell user to:
1. Start a chat with their new bot
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Find `chat.id` in the JSON response

Add to `.env`:
```
TELEGRAM_CHAT_ID=your_chat_id
```

## Step 4: Restart

```bash
# Restart backend to pick up new credentials
cd agentbot-backend
npm run dev
```

## Verify

Send a message to the bot on Telegram → should receive a response from Agentbot.

## Troubleshooting

**Bot not responding:**
- Verify token is correct in `.env`
- Check `/getUpdates` URL shows the bot was contacted
- Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are both set

**"Forbidden" error:** Start chat with bot first by sending `/start`
