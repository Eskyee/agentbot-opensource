# LLM Gateway

Unified access to 40+ AI models via `https://llm.bankr.bot`.

## Setup

```bash
bankr llm setup openclaw --install
bankr llm credits add 25   # top up before use
bankr llm credits           # check balance
```

Enable LLM Gateway on your API key at https://bankr.bot/api-keys.

## Authentication

Use `BANKR_LLM_KEY` env var (falls back to `BANKR_API_KEY`). Credits: $1 = 1 credit.

## Available Models

40+ models including Claude (Anthropic), GPT (OpenAI), Gemini (Google), DeepSeek, Alibaba Qwen. Context windows 164K–2M tokens.

## Integration

Compatible with OpenClaw, Claude Code, Cursor, or direct SDK calls (OpenAI/Anthropic-compatible API). Auto normalizes formats across providers with multi-provider failover.
