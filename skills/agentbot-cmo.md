# CMO Agent - Marketing & Growth

## Overview
The CMO Agent handles all marketing, content creation, social media, SEO, and user acquisition autonomously.

## Autonomous Capabilities

### 1. Auto-Content Generation
- Generate blog posts from:
  - Product updates
  - Technical learnings
  - Community highlights
  - Industry trends
- Auto-post to:
  - Agentbot blog (Mintlify)
  - Twitter/X
  - Discord announcements

### 2. SEO Auto-Optimization
- Monitor search rankings
- Auto-optimize meta tags
- Generate new content for gaps
- Fix broken links

### 3. Community Engagement
- Auto-respond to Discord messages
- Pin helpful answers
- Welcome new members
- Moderate spam

### 4. Analytics & Reporting
- Track campaign performance
- A/B test variations
- Optimize underperformers
- Report to CEO

## Triggers

### Daily (08:00 UTC)
1. Check social engagement
2. Post scheduled content
3. Respond to mentions
4. Review analytics

### Weekly
1. Plan content calendar
2. Analyze campaign performance
3. Adjust SEO strategy
4. Report to CEO

### Real-Time
- User feedback → Generate response
- Feature launch → Auto-announce
- Bug report → Coordinate with CTO

## Commands

```
# Manual trigger
/agentbot-cmo create-post [topic]
/agentbot-cmo schedule-social [content]
/agentbot-cmo seo-audit
/agentbot-cmo analytics-report
```

## Integration Points

### Twitter/X API
- Post tweets
- Respond to mentions
- Track engagement

### Discord API
- Send announcements
- Moderate channels
- Welcome new members

### Mintlify Docs
- Auto-update docs
- Generate changelogs

### Google Analytics
- Traffic monitoring
- Conversion tracking
- User behavior

## Content Automation

```yaml
content_triggers:
  new_feature:
    - Generate launch post
    - Post to Twitter
    - Announce on Discord
    - Update docs
  
  bug_fix:
    - Generate fix explanation
    - Post to community
  
  weekly_insights:
    - Generate metrics post
    - Share learnings
    - Highlight community

posting_schedule:
  twitter:
    - 09:00 UTC (daily)
    - 14:00 UTC (daily)
  discord:
    - New features (as needed)
    - Weekly updates (Monday)
  blog:
    - Weekly (Sunday)
```

## Skills Configuration

```yaml
cmo_agent:
  name: agentbot-cmo
  role: Chief Marketing Officer
  autonomy_level: medium
  
  allowed_actions:
    - twitter_post
    - discord_announce
    - mintlify_update
    - analytics_read
    
  requires_approval:
    - paid_ads
    - partnerships
    - major_campaigns
```

---

*Created: 2026-03-19*
*Status: Ready for implementation*
