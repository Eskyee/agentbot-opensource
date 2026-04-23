# Learnings & Task Reviews

## [LRN-20260423-001] Resilience in Multi-Provider Probing

**Priority**: medium
**Status**: promoted
**Area**: infra

### 内容
When probing multiple external hosts (like Soul nodes), a 502 Bad Gateway should not be treated as a terminal "down" state if no 200 OK hosts are found. A 502 indicates the host is known but temporarily unavailable (Railway sleeping).

### 建议修复
Implement a "lazy fallback" pattern:
1. Probe for Healthy (200).
2. If none, fall back to "Maybe" (502).
3. If none, then fail.

### 元数据
- Source: error
- See Also: ERR-20260423-001
- Promoted-To: AGENTS.md
