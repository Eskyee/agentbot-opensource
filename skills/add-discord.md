---
name: add-discord
description: Add Discord bot channel to Agentbot. Use when user wants to connect Discord as a messaging channel. Triggers on "add discord", "discord bot", "connect discord".
---

# Add Discord Channel

Guide user through setting up a Discord bot for Agentbot.

## Step 1: Create Discord Application

Tell user to:
1. Go to https://discord.com/developers/applications
2. Click "New Application" → name it
3. Go to "Bot" → "Reset Token" → copy the token
4. Enable "Message Content Intent" in Bot settings

## Step 2: Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Scopes: `bot`
3. Bot Permissions: `Send Messages`, `Read Message History`, `Use Commands`
4. Copy generated URL → open in browser → select server

## Step 3: Configure Agentbot

Add to backend `.env`:
```
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_server_id
DISCORD_CHANNEL_ID=your_channel_id
```

To get IDs: Enable Developer Mode in Discord → right-click server/channel → "Copy ID"

## Step 4: Restart

```bash
cd agentbot-backend
npm run dev
```

## Verify

Mention the bot in your Discord server → should respond.

## Troubleshooting

**Bot offline:** Check https://discord.com/developers/applications → Bot status

**"Missing Access":** Bot needs to be in the server with proper permissions

**Intents error:** Ensure "Message Content Intent" is enabled in Bot settings
