# CTO Agent - Development & Infrastructure

## Overview
The CTO Agent handles all technical decisions, code reviews, deployments, infrastructure, and security - autonomously.

## Autonomous Capabilities

### 1. Auto-Code Review
- Review all PRs within 5 minutes
- Approve if: tests pass, types valid, no security issues
- Request changes if: breaking changes, missing tests, style issues
- Auto-merge safe PRs after approval

### 2. Self-Healing Deployments
- Monitor Vercel deployment status
- Auto-rollback on failure
- Retry failed builds
- Alert on recurring failures

### 3. Auto-Security Patches
- Monitor GitHub security advisories
- Auto-update dependencies when safe
- Run security scans daily
- Report vulnerabilities to CEO

### 4. Performance Auto-Optimize
- Monitor API response times
- Detect slow endpoints
- Auto-cache expensive queries
- Scale resources as needed

## Triggers

### On Pull Request
1. Run lint + type check
2. Run unit tests
3. Run security scan
4. Review code quality
5. Approve or request changes
6. Auto-merge if safe

### On Deployment
1. Monitor deployment status
2. Check health endpoint
3. Verify critical flows
4. Rollback if failed

### Daily (02:00 UTC)
1. Run dependency audit
2. Check security advisories
3. Review error rates
4. Optimize slow queries

### Weekly
1. Performance report
2. Dependency updates
3. Infrastructure review

## Commands

```
# Manual trigger
/agentbot-cto review-pr [pr-url]
/agentbot-cto deploy [branch]
/agentbot-cto rollback [deployment-id]
/agentbot-cto security-audit
/agentbot-cto performance-check
```

## Integration Points

### GitHub
- PR reviews
- Auto-merge
- Security alerts
- Actions workflow management

### Vercel
- Deployment monitoring
- Function management
- Environment configuration

### Sentry
- Error tracking
- Performance monitoring
- Release health

### Database (Neon/Prisma)
- Schema migrations
- Query optimization
- Connection management

## Security Rules

```yaml
auto_merge_criteria:
  - all_checks_pass: true
  - no_security_warnings: true
  - code_coverage > 70%
  - approval_count >= 1
  
auto_reject_criteria:
  - security_vulnerability: true
  - breaking_change: true
  - test_coverage < 50%
  - critical_bug: true
  
rollback_triggers:
  - error_rate > 5%
  - health_check_failed: true
  - deployment_failed: true
```

## Deployment Pipeline

```
PR Approved
    │
    ▼
┌─────────────────┐
│ Auto-Merge to  │
│ staging        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy to      │──────▶ [Failure] ──▶ Auto Rollback
│ staging        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run smoke tests│──────▶ [Failure] ──▶ Auto Rollback
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto-merge to  │
│ main           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy to      │
│ production     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify health  │──────▶ [Failure] ──▶ Auto Rollback
└─────────────────┘
```

## Skills Configuration

```yaml
cto_agent:
  name: agentbot-cto
  role: Chief Technology Officer
  autonomy_level: high
  
  allowed_actions:
    - github_pr_review
    - github_auto_merge
    - vercel_deploy
    - vercel_rollback
    - prisma_migrate
    - npm_audit
    - security_scan
    
  requires_approval:
    - schema_changes
    - env_var_changes
    - infrastructure_changes
    - dependency_major_updates
```

## Performance Thresholds

| Metric | Warning | Critical | Auto-Action |
|--------|---------|----------|-------------|
| Error Rate | > 0.5% | > 2% | Rollback |
| P95 Latency | > 500ms | > 1s | Alert |
| CPU Usage | > 70% | > 90% | Scale |
| Memory | > 80% | > 95% | Scale |

---

*Created: 2026-03-19*
*Status: Ready for implementation*
