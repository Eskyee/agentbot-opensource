# OpenClaw v2026.4.5 Feature Guide

**Updated:** April 7, 2026

## New in v2026.4.5

### Video Generation
- **Tool:** `video_generate` (built-in)
- **Providers:** xAI (grok-imagine-video), Alibaba Model Studio Wan, Runway
- **Usage:** Agents can create videos and return generated media directly in replies

### Music Generation
- **Tool:** `music_generate` (built-in)
- **Providers:** Google Lyria, MiniMax, ComfyUI workflow-backed
- **Features:** Async task tracking, follow-up delivery of finished audio

### ComfyUI Integration
- Bundled workflow media plugin for local ComfyUI and Comfy Cloud
- Supports image_generate, video_generate, music_generate
- Includes prompt injection, reference-image upload, live tests

### New Providers
| Provider | Type | Notes |
|----------|------|-------|
| Qwen | Chat/Reasoning | Bundled |
| Fireworks AI | Generation | High-throughput |
| StepFun | Bundled | |
| MiniMax TTS | Speech | |
| Bedrock Mantle | Inference | Auto profile discovery |
| Ollama Web Search | Search | |
| MiniMax Search | Chat/Search | |

### Multilingual Control UI
Supported languages:
- Simplified Chinese
- Traditional Chinese
- Brazilian Portuguese
- German
- Spanish
- Japanese
- Korean
- French
- Turkish
- Indonesian
- Polish
- Ukrainian

### Memory & Dreaming (Experimental)
/dreaming command, Dream Diary surface, configurable aging controls

## Breaking Changes

Legacy config aliases removed. Use canonical paths:
- `talk.voiceId` → `talk.provider.voiceId`
- `talk.apiKey` → `talk.provider.apiKey`
- `agents.*.sandbox.perSession` → removed
- `browser.ssrfPolicy.allowPrivateNetwork` → removed

Run `openclaw doctor --fix` to migrate existing configs.

## Agentbot Integration

All Agentbot containers auto-update. New skills added:
- Video Generator
- Music Generator
- ComfyUI Workflows
- Qwen AI
- Fireworks AI
- Bedrock Mantle

## Troubleshooting

**Provider not working:**
1. Check `openclaw status --verbose` for provider diagnostics
2. Verify API keys in config
3. Run `openclaw doctor` for health checks

**Video/Music generation failing:**
- Check async task status with `openclaw tasks`
- Verify provider supports async (Lyria, MiniMax)
- Check output delivery settings

**Config migration issues:**
- Run `openclaw doctor --fix` 
- Backup config before applying fixes
- Check `openclaw config validate`