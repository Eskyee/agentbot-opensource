# Agentbot OpenClaude

Agentbot pins the GitLawb OpenClaude CLI as a repo tool dependency:

```bash
npm install
npm run openclaude:agentbot
```

The launcher maps Agentbot gateway environment variables into OpenClaude's OpenAI-compatible provider path:

- `AI_GATEWAY_API_KEY`
- `VERCEL_AI_GATEWAY_KEY`
- `VERCEL_AI_GATEWAY_API_KEY`
- `OPENAI_API_KEY`

Defaults:

- `OPENAI_BASE_URL=https://ai-gateway.vercel.sh/v1`
- `OPENAI_MODEL=xiaomi/mimo-v2.5-pro`
- `CLAUDE_CODE_USE_OPENAI=1`

Override any of those environment variables before running the command to use OpenRouter, Ollama, LM Studio, LiteLLM, or another OpenAI-compatible gateway.

The repo includes `.openclaude-profile.json` as a secret-free profile record so clones can see the intended provider, model, and command shape without committing keys.
