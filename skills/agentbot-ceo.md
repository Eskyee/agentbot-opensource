# CEO Agent - Strategic Leadership

## Overview
The CEO Agent is the central coordinator for all autonomous operations. It sets goals, monitors performance, and coordinates the other department agents.

## Skills Required
- strategic-decision-making
- okr-management
- financial-analysis
- multi-agent-coordination
- daily-reporting
- self-improving-agent

## Triggers

### Daily (06:00 UTC)
1. Run `daily-standup` - Collect reports from all department agents
2. Analyze metrics from:
   - Vercel (deployments, performance)
   - Stripe (revenue, subscriptions)
   - Database (user activity, errors)
   - Sentry (error rates)
3. Generate daily report
4. Flag any issues requiring attention

### Weekly (Monday 09:00 UTC)
1. Review OKR progress
2. Analyze department performance
3. Set priorities for coming week
4. Identify needed interventions

### Real-Time Events
- **Deployment failed:** Escalate to CTO
- **Revenue anomaly:** Escalate to CFO
- **Support spike:** Escalate to CXO
- **Security incident:** Escalate to CTO + human

## Commands

```
# Manual trigger
/agentbot-ceo daily-report
/agentbot-ceo analyze-metrics
/agentbot-ceo set-goals [goal]
/agentbot-ceo escalate [issue]
```

## Integration Points

### Vercel
- Deployment status
- Performance metrics
- Function invocations

### Stripe
- MRR tracking
- Churn alerts
- Invoice status

### Sentry
- Error rate monitoring
- Performance degradation
- Security vulnerabilities

### Database
- User activity metrics
- Feature usage
- Growth trends

## Decision Framework

```
IF revenue_change < -10%:
  → Trigger CFO analysis
  → Adjust pricing strategy
  
IF error_rate > 1%:
  → Trigger CTO incident response
  
IF support_tickets > threshold:
  → Trigger CXO capacity increase
  
IF deployment_failed:
  → Trigger CTO auto-rollback
  → Log for review
```

## Reporting

### Daily Report Output
```markdown
# Agentbot Daily Report - [DATE]

## Metrics
- Revenue: $X (vs yesterday: +X%)
- Active Users: X (vs yesterday: +X%)
- Uptime: 99.X%
- API Calls: X

## Department Status
- CTO: ✅ Operational
- CMO: ✅ Active campaigns: X
- CFO: ✅ Processing: X invoices
- CXO: ✅ Open tickets: X

## Action Items
- [ ] Review CTO security patch
- [ ] Approve CMO blog post topic
- [ ] Verify CFO monthly report

## Human Input Needed
- None (fully autonomous)
```

## Skills Configuration

```yaml
ceo_agent:
  name: agentbot-ceo
  role: Chief Executive Officer
  autonomy_level: high
  
  allowed_actions:
    - read_all_metrics
    - send_slack_reports
    - create_github_issues
    - adjust_autorun_settings
    
  requires_approval:
    - budget_changes > $1000
    - pricing_changes
    - major_feature_launches
    - security_incidents
```

## Self-Improvement

The CEO Agent uses `self-improving-agent` to:
- Track decision outcomes
- Learn from pattern analysis
- Optimize coordination workflows
- Improve report accuracy

---

*Created: 2026-03-19*
*Status: Ready for implementation*
