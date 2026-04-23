# Error Log
All system and tool errors are recorded here for proactive healing.

---
## [ERR-20260423-001] Colony API 503 (Soul Offline)

**Priority**: high
**Status**: resolved
**Area**: infra

### 摘要
The Borg Dashboard reported "Soul offline" (503) because the underlying soul host returned 502 Bad Gateway (Railway sleeping).

### 错误信息
```
No healthy soul host found from: https://agentbot-agent-8711c7cdf8242b25-production.up.railway.app, https://borg-0-production.up.railway.app
```

### 上下文
- `GET /api/colony/status`
- Railway services were returning 502 (cold start or overloaded).

### 建议修复
Loosen `isUsableSoulHost` to treat 502 as a "maybe" candidate instead of "down", allowing the dashboard to wait for boot rather than crashing.

### 元数据
- Reproducible: yes
- See Also: LRN-20260423-001
