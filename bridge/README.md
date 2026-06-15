# OpenClaw Bridge — Remote Chat

Chat with your local OpenClaw from anywhere. iPhone, iPad, laptop — any browser.

## Architecture

```
Your iPhone → agentbot.sh/chat → WebSocket relay → Mac mini → OpenClaw
```

No port forwarding. No DNS. No ngrok. Uses your existing agentbot.sh domain.

## Quick Start

### 1. Get your bridge secret

```bash
# Generate a random secret
openssl rand -hex 32
```

Add it to agentbot.sh as `BRIDGE_SECRET` env var (Vercel dashboard).

### 2. Get your OpenClaw token

```bash
openclaw gateway token
```

### 3. Start the bridge client

```bash
BRIDGE_SECRET=<your-secret> \
OPENCLAW_TOKEN=<your-token> \
node ~/.openclaw/bridge/client.js
```

You should see:
```
🦞 OpenClaw Bridge Client starting...
   Bridge: wss://agentbot.sh/api/bridge/ws
   OpenClaw: http://localhost:18789
   User: admin
✅ Bridge connected
🔗 Bridge session: admin-1717412345678
```

### 4. Open on your iPhone

Go to `https://agentbot.sh/chat` — sign in with your admin account.

That's it. You're chatting with your local OpenClaw from your phone.

## How it works

1. Bridge client opens a persistent WebSocket to agentbot.sh
2. You send a message from the chat UI
3. Server relays it through the WebSocket to your Mac mini
4. Bridge client forwards it to local OpenClaw (localhost:18789)
5. Response flows back through the same path

## Auto-start (macOS LaunchAgent)

To start the bridge automatically on boot:

```bash
cat > ~/Library/LaunchAgents/com.agentbot.bridge.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.agentbot.bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/raveculture/.openclaw/bridge/client.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>BRIDGE_SECRET</key>
        <string>YOUR_SECRET_HERE</string>
        <key>OPENCLAW_TOKEN</key>
        <string>YOUR_TOKEN_HERE</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/raveculture/.openclaw/bridge/bridge.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/raveculture/.openclaw/bridge/bridge.log</string>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.agentbot.bridge.plist
```

## Troubleshooting

**"Bridge not connected"**
- Check bridge client is running
- Check BRIDGE_SECRET matches on both sides
- Check OPENCLAW_TOKEN is valid

**"Request timed out"**
- OpenClaw may be slow to respond
- Check OpenClaw is running: `openclaw gateway status`
- Check bridge client logs

**"Admin access required"**
- Only admin emails can use the bridge
- Add your email to the adminEmails list in `/api/chat/route.ts`
