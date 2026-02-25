# Smoke Test Report - Agentbot

**Date**: February 25, 2026, 13:50 UTC  
**Commit**: Current  
**Status**: ⚠️ MOSTLY PASSED (Build Issue Detected)

---

## Summary

| Category | Status | Details |
|----------|--------|---------|
| Backend Tests | ✅ PASSED | 4/4 tests passed |
| TypeScript Check | ✅ PASSED | No compilation errors |
| Production Health | ✅ PASSED | All endpoints responding |
| Web Build | ❌ FAILED | "generate is not a function" error |

---

## Backend API Tests (agentbot-backend)

```
PASS src/api.test.ts
  Backend API Tests
    GET /health
      ✓ should return health status (9 ms)
    POST /api/register
      ✓ should register a new user (5 ms)
      ✓ should reject missing email (1 ms)
      ✓ should reject missing password (1 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        0.426 s
```

**Status**: ✅ ALL TESTS PASSED

---

## TypeScript Compilation

### Web (Next.js)
```bash
$ npx tsc --noEmit
# Exit code: 0 - No errors
```

### Backend
```bash
$ npx tsc --noEmit
# Exit code: 0 - No errors
```

**Status**: ✅ NO TYPESCRIPT ERRORS

---

## Production Health Checks

All production endpoints responding correctly:

| Endpoint | Status | Response |
|----------|--------|----------|
| `/` (Homepage) | ✅ 200 | HTML rendered correctly |
| `/pricing` | ✅ 200 | Page loads |
| `/blog` | ✅ 200 | Page loads |
| `/docs` | ✅ 200 | Page loads |
| `/login` | ✅ 200 | Page loads |
| `/api/health` | ✅ 200 | `{"status":"ok"}` |
| `/api/models` | ✅ 200 | API responding |

**Production URL**: https://agentbot.raveculture.xyz  
**Status**: ✅ ALL ENDPOINTS HEALTHY

---

## Web Build Issue

### Error
```
> Build error occurred
TypeError: generate is not a function
    at ignore-listed frames
```

### Analysis
- Error occurs during `next build` execution
- Prisma client generates successfully
- TypeScript compilation passes
- Error is in Next.js build internal frames (ignored)
- Likely related to:
  - Next.js 16.1.6 with Turbopack
  - Possible module resolution issue with `ai` package's `experimental_generateVideo`

### Affected Files
- [`web/app/lib/video.ts`](web/app/lib/video.ts) - Uses `experimental_generateVideo` from `ai` package
- [`web/app/api/generate-video/route.ts`](web/app/api/generate-video/route.ts) - Video generation API route
- [`web/app/generate-video/page.tsx`](web/app/generate-video/page.tsx) - Video generation UI

### Workaround Attempted
- Changed import from `import { experimental_generateVideo as generateVideo }` to direct usage
- Issue persists - appears to be Next.js build system related

### Impact
- ⚠️ Local builds fail
- ✅ Production deployment works (Vercel auto-deploys successfully)
- Video generation feature may not work correctly

---

## Playwright E2E Tests

**Status**: ⏸️ SKIPPED

Playwright tests are configured to run against production URL (`https://agentbot.raveculture.xyz`).
Tests require browser installation and are designed for CI/CD pipeline.

Test file: [`web/tests/frontend.spec.ts`](web/tests/frontend.spec.ts)
- 7 tests defined for homepage, pricing, login, docs, blog, footer, and navbar

---

## Database Schema

Prisma schema validated successfully with 12 models:
- User, Account, Session, VerificationToken (Auth)
- ScheduledTask, AgentMemory, AgentFile (Phase 1)
- Skill, InstalledSkill (Phase 2)
- AgentSwarm, Workflow, WorkflowNode (Phase 3)

---

## Recommendations

### Immediate Actions
1. **Investigate Next.js build error** - The "generate is not a function" error needs debugging
2. **Check Vercel build logs** - Production builds may have different behavior
3. **Consider downgrading Next.js** - Version 16.1.6 may have compatibility issues

### Long-term Actions
1. Add more backend unit tests for API routes
2. Set up CI/CD pipeline with automated smoke tests
3. Add integration tests for database operations
4. Monitor production health with alerts

---

## Test Summary

| Category | Tests | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| Backend Unit | 4 | 4 | 0 | 0 |
| TypeScript | 2 | 2 | 0 | 0 |
| Production Health | 7 | 7 | 0 | 0 |
| Web Build | 1 | 0 | 1 | 0 |
| E2E (Playwright) | 7 | - | - | 7 |
| **TOTAL** | **21** | **13** | **1** | **7** |

---

## Conclusion

⚠️ **PARTIAL PASS**

- Core backend functionality is working correctly
- Production deployment is healthy and serving traffic
- TypeScript code is valid with no compilation errors
- **Critical Issue**: Local web build fails with cryptic error

The application is functional in production but the build issue needs investigation before the next deployment cycle.

---

**Tested By**: Kilo Code  
**Risk Level**: Medium (Build issue needs resolution)