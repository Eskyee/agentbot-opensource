# AgentBot - User Deployment Guide

## For End Users: Deploy OpenClaw in 3 Steps

### ✅ What You Need

1. **Telegram Bot Token** - Get from [@BotFather](https://t.me/BotFather) on Telegram
2. **AI Provider Key** - OpenRouter, Gemini, OpenAI, or others
3. **5 minutes** - That's all it takes!

---

## Step 1: Get Your Telegram Bot Token

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Give your bot a name (e.g., "My AI Assistant")
4. Give your bot a username (e.g., "my_ai_bot")
5. Copy the token provided (looks like: `123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh`)

**Keep this token safe!** You'll need it to deploy your agent.

---

## Step 2: Get Your AI Provider API Key

### Option A: OpenRouter (Recommended - Free tier available)
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up for free
3. Go to API Keys section
4. Copy your API key

### Option B: Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy your API key

### Option C: OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Go to API Keys
3. Create a new API key
4. Copy your API key

---

## Step 3: Deploy Your Agent

### Via Web Interface

1. Go to **http://your-agentbot-url**
2. Click **"Get Started →"**
3. Fill in the form:
   - **Telegram Bot Token**: Paste your token from Step 1
   - **AI Provider**: Select your provider
   - **API Key**: Paste your AI provider key from Step 2
   - **Plan**: Choose your plan
4. Click **"Deploy"**
5. Wait 10-30 seconds...
6. **Your agent is live!** 🎉

### Via API

```bash
curl -X POST https://your-agentbot-url/api/provision \
  -H "Content-Type: application/json" \
  -d '{
    "telegramToken": "YOUR_TELEGRAM_TOKEN",
    "aiProvider": "openrouter",
    "apiKey": "YOUR_API_KEY",
    "plan": "Your Plan Name"
  }'
```

---

## What Happens Next?

### ✅ Your Agent Goes Live

1. **Created** - AgentBot creates a Docker container for your agent
2. **Configured** - Your Telegram bot settings are applied
3. **Started** - Your agent comes online
4. **Ready** - Users can start messaging your bot on Telegram!

### 📊 Monitor Your Agent

1. Go to **Dashboard → Heartbeat**
2. See your agent's status in real-time
3. View message counts and metrics
4. Check system health

### 🔑 Manage Your API Keys

1. Go to **Dashboard → Keys**
2. Create new API keys for programmatic access
3. Revoke old keys when needed
4. Copy keys to use in your applications

### 📈 View Statistics

1. Go to **Dashboard → Stats**
2. See CPU and memory usage
3. Check system health status
4. View performance metrics

---

## Common Questions

### Q: How many agents can I deploy?
**A:** Up to 20-30 concurrent agents on our standard plan. Contact support for higher limits.

### Q: How long does deployment take?
**A:** Usually 10-30 seconds. Your agent will be live and ready to chat!

### Q: Can I update my agent settings?
**A:** Yes! Go to Dashboard and update your agent configuration anytime.

### Q: What if deployment fails?
**A:** You'll see a clear error message. Common issues:
- Invalid Telegram token → Get a new token from @BotFather
- Invalid API key → Check your AI provider key
- Port conflict → Our system will retry automatically

### Q: Can I delete an agent?
**A:** Yes! Go to Dashboard → Agents and click "Delete". All associated data will be archived.

### Q: How do I backup my agent data?
**A:** Automatic daily backups are enabled. Contact support for manual exports.

---

## API Access

### Get Your Agent Status

```bash
curl https://your-agentbot-url/api/heartbeat
```

### View System Health

```bash
curl https://your-agentbot-url/api/health
```

### Get Metrics

```bash
curl https://your-agentbot-url/api/metrics
```

### Create API Key

```bash
curl -X POST https://your-agentbot-url/api/keys \
  -d '{"name": "My API Key"}'
```

---

## Support & Resources

### Documentation
- [Full API Documentation](./API_DOCS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Best Practices](./BEST_PRACTICES.md)

### Help
- Email: support@agentbot.raveculture.xyz
- Chat: Message @AgentBot on Telegram
- Docs: https://docs.agentbot.raveculture.xyz

### Status
- System Status: https://status.agentbot.raveculture.xyz
- Incident Reports: https://status.agentbot.raveculture.xyz/incidents

---

## Pro Tips

✅ **Keep your Telegram token safe** - Don't share it with anyone

✅ **Use unique API keys per agent** - Makes management easier

✅ **Monitor your usage** - Check Dashboard → Stats regularly

✅ **Set up alerts** - Get notified if your agent goes down

✅ **Backup frequently** - Request data exports regularly

✅ **Update credentials** - Rotate keys every 90 days

✅ **Test before production** - Deploy test agents first

---

## You're All Set! 🚀

Your AI agent is now deployed and ready to serve thousands of users on Telegram.

**What to do next:**
1. Test your agent on Telegram
2. Monitor real-time metrics
3. Invite users to chat with your agent
4. Scale up as needed

**Questions?** Contact support anytime. We're here to help!

---

**AgentBot** - Deploy AI Agents in Seconds  
*Powered by OpenClaw*
