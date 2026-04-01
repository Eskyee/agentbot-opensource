/**
 * Hooks Module — Docker Agent Permission Integration
 *
 * Exports:
 * - pre-tool-use.sh: Hook script for docker agent --hook-pre-tool-use
 * - agent-template.yaml: Agent config template with permission awareness
 *
 * The hook script calls POST /api/hooks/classify on the Agentbot backend.
 * The backend classifies the tool call and returns allow/deny/queue.
 *
 * Integration:
 *   docker agent run agent-template.yaml \
 *     --hook-pre-tool-use ./pre-tool-use.sh \
 *     --env AGENTBOT_API_URL=https://agentbot.raveculture.xyz \
 *     --env AGENTBOT_USER_ID=user_123 \
 *     --env INTERNAL_API_KEY=...
 */
