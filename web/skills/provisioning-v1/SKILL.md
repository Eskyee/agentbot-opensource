# provision-agent Skill

## Trigger
Use this skill when the user wants to provision, spawn, or birth a new OpenClaw agent on the Agentbot platform.

## Usage
`provision-agent --token <TELEGRAM_TOKEN> --provider <AI_PROVIDER> --key <API_KEY> --plan <PLAN>`

## Workflow
1. **Pre-flight Check:**
   - Verify `<TELEGRAM_TOKEN>` is valid with the Telegram API.
   - Check `<API_KEY>` for minimum balance (if applicable).
2. **Instance Creation:**
   - Call the `infra/scripts/provision.sh` script to allocate a port and spin up the Docker container.
3. **Verification Hook:**
   - Ping the new instance at `https://<USER_ID>.agents.agentbot.raveculture.xyz/api/health`.
   - Wait for a 200 OK.
4. **Handoff:**
   - Return the `userId`, `subdomain`, and `url` to the requester.

## Parameters
- `token`: Telegram Bot Token (required)
- `provider`: AI Provider (e.g., openrouter, anthropic, google)
- `key`: API Key for the chosen provider
- `plan`: Subscription plan (free, pro, custom)

---
*Status: v1.0.0-draft | Operator: Atlas*
