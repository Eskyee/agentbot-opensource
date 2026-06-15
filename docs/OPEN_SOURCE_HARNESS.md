# Open Source Harness Strategy

Based on gitlawb's OpenClaude - the open-source harness for AI coding agents.

## What is a Harness?

A harness is an open-source runtime that powers a hosted product. Users can:
- Inspect the code
- Modify it
- Run it themselves
- Understand the system before committing

## OpenClaude Example (18.7k ⭐)

GitHub: https://github.com/Gitlawb/openclaude

**Key Features:**
- Multi-provider support (OpenAI, Gemini, DeepSeek, Ollama, Codex, GitHub Models, 200+)
- Agent routing - route different agents to different models
- gRPC server for headless operation
- VS Code extension
- Slash commands (`/provider`, `/onboard-github`)
- Streaming responses
- MCP tools

**Install:**
```bash
npm install -g @gitlawb/openclaude
openclaude
```

## Agentbot Harness Strategy

For agentbot to follow this pattern:

### 1. Core Agent Runtime (Open Source)
Release the core agent engine as open source:
- Agent execution logic
- Tool definitions
- Provider abstraction
- MCP tools

### 2. Hosted Layer (Proprietary)
Build on top:
- User management
- Billing/payments
- Dashboard/UI
- Hosting/infrastructure

### 3. Product Surface
Just like gitlawb does - give technical users:
- Repo to inspect
- Documentation
- Clear path to self-host

## Comparison

| Aspect | OpenClaude | Agentbot (Target) |
|--------|------------|-------------------|
| Stars | 18.7k | - |
| Language | TypeScript | TypeScript/Go |
| Multi-provider | ✅ | ✅ |
| Agent routing | ✅ | ✅ |
| gRPC | ✅ | ✅ |
| MCP | ✅ | ✅ |
| VS Code | ✅ | - |

## Action Items

1. **Extract core agent runtime** from agentbot-backend
2. **Open source** on GitHub with MIT license
3. **Build docs** explaining the architecture
4. **Add to gitlawb** for network effects

## References

- OpenClaude: https://github.com/Gitlawb/openclaude
- Gitlawb Philosophy: "The best users want to inspect the runtime, modify it, and understand the system before they commit."

---

*Strategy inspired by gitlawb's OpenClaude harness approach*