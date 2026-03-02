# Code Review: Gemini Model Changes

**Date:** 2026-03-02  
**Files:** `agentbot-backend/src/index.ts`  
**Reviewer:** OpenCode

---

## Summary

Review of AI provider configuration focusing on Gemini integration.

---

## Current Configuration

| Setting | Value | File:Line |
|---------|-------|------------|
| Default Model | `google/gemini-2.0-flash` | index.ts:30 |
| Gemini Key Env | `GEMINI_API_KEY` | index.ts:326 |
| Hardcoded Model | `google/gemini-2.0-flash` | index.ts:331 |

---

## What's Working ✅

1. **API Key Resolution** - Properly reads from env vars and user onboarding
2. **Multiple Providers** - Supports Google, Groq, Anthropic, OpenAI
3. **Error Handling** - Clear error messages when keys missing

---

## Issues Found

### 1. Hardcoded Model Selection
**Severity:** 🟡 Medium  
**Location:** `index.ts:331`

**Problem:**
```typescript
model = 'google/gemini-2.0-flash';
```

User's requested model is ignored - always uses flash.

**Recommendation:**
```typescript
// Allow user choice with fallback
model = userRequestedModel || 'google/gemini-2.0-flash';
```

---

### 2. No Gemini 3 Support
**Severity:** 🟡 Low  
**Location:** `index.ts`

**Problem:**
Only `gemini-2.0-flash` available, not newer models.

**Options:**
- Add `gemini-2.0-flash-8b`
- Add `gemini-2.0-pro` 
- Add `gemini-3-flash`

---

### 3. NPM Vulnerabilities
**Severity:** ⚠️ 22 high severity

**Fix:**
```bash
cd agentbot-backend
npm audit fix
```

---

## Recommendations

1. **Medium Priority** - Allow user model selection
2. **Low Priority** - Add newer Gemini models
3. **High Priority** - Fix npm vulnerabilities

---

## Status

✅ Ready for deployment with minor improvements
