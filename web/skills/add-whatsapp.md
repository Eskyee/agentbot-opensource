---
name: add-whatsapp
description: Add WhatsApp channel to Agentbot. Use when user wants to connect WhatsApp as a messaging channel. Triggers on "add whatsapp", "whatsapp bot", "connect whatsapp".
---

# Add WhatsApp Channel

Guide user through setting up WhatsApp for Agentbot.

## Step 1: Get WhatsApp Business API Credentials

Tell user they need:
1. WhatsApp Business Account (https://business.facebook.com)
2. Meta Developer Account (https://developers.facebook.com)
3. Create app → WhatsApp → Get Phone Number ID and Access Token

## Step 2: Configure Agentbot

Add to backend `.env`:
```
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

## Step 3: Set Webhook

1. In Meta Developer Console → WhatsApp → Configuration
2. Webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
3. Verify token: set `WHATSAPP_VERIFY_TOKEN` in .env (your chosen token)
4. Subscribe to: `messages`

## Step 4: Restart

```bash
cd agentbot-backend
npm run dev
```

## Alternative: WhatsApp Cloud API (Easier)

1. Go to https://developers.facebook.com/
2. Create app → WhatsApp
3. In "API Setup" get:
   - Phone Number ID
   - Access Token (temporary - may need to refresh)
4. Use these in .env

## Verify

Send a message to your WhatsApp number → should receive response from Agentbot.

## Troubleshooting

**Webhook not verifying:**
- Check URL is publicly accessible (not localhost)
- Verify token matches exactly
- Check WhatsApp API version in use

**"Phone number not verified":**
- Complete WhatsApp Business verification on Meta
- Use a verified phone number
