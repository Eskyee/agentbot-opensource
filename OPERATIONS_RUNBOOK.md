# BASEFM OPERATIONS RUNBOOK
## Launch Day + Post-Launch Operations Guide

---

## TABLE OF CONTENTS

1. [Pre-Launch Checklist (Mar 30)](#pre-launch-checklist)
2. [Launch Day Procedure (Mar 31, 00:00 UTC)](#launch-day-procedure)
3. [First 24 Hours Monitoring](#first-24-hours-monitoring)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Escalation Procedures](#escalation-procedures)
6. [Post-Launch Week](#post-launch-week)

---

## PRE-LAUNCH CHECKLIST

**Date:** March 30, 2026 (Day Before Launch)  
**Owner:** Operations Lead  
**Duration:** ~2 hours

### Morning (08:00 UTC)

- [ ] **Systems Check**
  ```bash
  # Verify all endpoints responding
  curl -s https://agentbot-api.onrender.com/health | jq .
  curl -s https://basefm.space/ | grep -i "basefm"
  
  # Check status pages
  # Render: https://status.render.com/
  # Vercel: https://www.vercelstatus.com/
  # Mux: https://status.mux.com/
  ```
  - [ ] API responding
  - [ ] Frontend accessible
  - [ ] No incidents reported

- [ ] **Database Integrity**
  ```bash
  # Verify database health
  docker exec basefm-postgres-prod pg_isready -U agentbot
  
  # Check connection pool
  docker exec basefm-postgres-prod psql -U agentbot -d agentbot_db \
    -c "SELECT count(*) FROM pg_stat_activity;"
  ```
  - [ ] Database responsive
  - [ ] Connections <15 of 20

- [ ] **Cache Status**
  ```bash
  # Verify Redis
  docker exec basefm-redis-prod redis-cli ping
  docker exec basefm-redis-prod redis-cli INFO stats
  ```
  - [ ] Redis responding
  - [ ] Memory usage normal

- [ ] **Monitoring Setup**
  ```bash
  # Verify monitoring dashboards
  curl -s http://localhost:9090/-/healthy
  curl -s http://localhost:3100/ready
  ```
  - [ ] Prometheus collecting metrics
  - [ ] Loki receiving logs
  - [ ] Grafana dashboards loading

### Afternoon (14:00 UTC)

- [ ] **Team Standup**
  ```
  Participants: Engineering, Ops, DevOps, On-Call
  Duration: 30 min
  
  Agenda:
  1. Review launch timeline
  2. Confirm all team roles/responsibilities
  3. Verify escalation contacts
  4. Run through emergency procedures
  5. Q&A
  ```

- [ ] **Final Code Verification**
  ```bash
  # Verify latest code deployed
  git log --oneline -5  # Should match deployed version
  
  # Check Render deployment
  curl -s https://agentbot-api.onrender.com/metrics | jq .build
  ```
  - [ ] Code version matches Git main
  - [ ] No pending deployments

- [ ] **Load Test (Final Baseline)**
  ```bash
  # Run 1-hour baseline test
  docker-compose -f docker-compose.load-test.yml up --scale load-test=1
  
  # Expected results:
  # - 100% success rate
  # - <100ms p95 latency
  # - 0% error rate
  ```
  - [ ] Test completed successfully
  - [ ] Metrics match expectations

- [ ] **Credential Verification**
  ```bash
  # Check all secrets in Vercel
  # Vercel Dashboard → Settings → Environment Variables
  
  Verify present:
  - [ ] MUX_TOKEN_ID
  - [ ] MUX_TOKEN_SECRET
  - [ ] JWT_SECRET
  - [ ] INTERNAL_API_KEY
  - [ ] DATABASE_URL (if using env)
  ```

- [ ] **Backup Verification**
  ```bash
  # Verify latest backup exists
  ls -lh backups/basefm-db-$(date +%Y-%m-%d)*.sql.gz
  
  # Verify S3 backup
  aws s3 ls s3://basefm-backups/ --recursive | tail -1
  ```
  - [ ] Database backup recent (<4h old)
  - [ ] S3 backup verified
  - [ ] Backup file size reasonable (>100MB)

### Evening (18:00 UTC)

- [ ] **On-Call Setup**
  ```
  Assign roles for Mar 31:
  - [ ] Primary on-call (monitoring, decisions)
  - [ ] Secondary on-call (escalation support)
  - [ ] Database expert (availability)
  - [ ] DevOps expert (infrastructure)
  - [ ] Frontend expert (deployment)
  
  Verify:
  - [ ] All contacts updated
  - [ ] Phones on, notifications enabled
  - [ ] Escalation procedures reviewed
  - [ ] War room link ready (Discord/Slack)
  ```

- [ ] **Communication Setup**
  ```
  Channels:
  - [ ] #ops-critical (alerts only)
  - [ ] #launch-day (team coordination)
  - [ ] War room (Discord emergency)
  - [ ] Twitter/X account ready (announcements)
  ```

- [ ] **Documentation Review**
  ```bash
  # Print these for reference
  - [ ] LAUNCH_QUICK_REFERENCE.md (quick lookup)
  - [ ] Common issues list (this runbook)
  - [ ] Recovery procedures (DISASTER_RECOVERY_BACKUP_PLAN.md)
  - [ ] Escalation contacts (updated list)
  ```

### Night Before (22:00 UTC)

- [ ] **Rest & Sleep**
  ```
  Team guidance:
  - No heroic measures needed
  - Servers don't need you all night
  - Monitor from home with alerts enabled
  - Everything is automated
  ```

---

## LAUNCH DAY PROCEDURE

**Date:** March 31, 2026  
**Start Time:** 00:00 UTC (midnight)  
**Owner:** Operations Lead  

### T-0:30 (23:30 UTC Mar 30)

**Pre-Launch Activities**

- [ ] **War Room Opening**
  ```
  Discord/Slack war room #ops-critical
  All on-call staff present
  Start recording/transcript
  ```

- [ ] **System Health Check**
  ```bash
  # Final verification
  curl -s https://agentbot-api.onrender.com/health
  curl -s https://basefm.space/api/live
  
  # Check databases
  docker ps -a | grep postgres
  docker ps -a | grep redis
  ```

- [ ] **Alert System Verification**
  ```
  Test alerts:
  - [ ] Prometheus alerts sending
  - [ ] Slack webhooks working
  - [ ] Email notifications enabled
  - [ ] PagerDuty on-call ready
  ```

- [ ] **Content Publishing Ready**
  ```
  Staging complete for:
  - [ ] Medium article (link ready)
  - [ ] Dev.to post (scheduled)
  - [ ] Twitter thread (drafts queued)
  - [ ] LinkedIn post (ready to publish)
  - [ ] Newsletter (ready to send)
  - [ ] Discord announcements (drafted)
  ```

### T-0:00 (00:00 UTC - LAUNCH TIME)

**GO LIVE**

```
🎯 LAUNCH MOMENT - All systems ready
```

- [ ] **Publish Announcements** (Staggered - first 30 sec)
  ```
  Timeline:
  00:00 - Twitter/X post (main announcement)
  00:05 - Discord announcement
  00:10 - LinkedIn post
  00:15 - Medium article publish
  ```

- [ ] **Monitor First Wave**
  ```
  Duration: First 5 minutes (critical)
  Metrics to watch:
  - [ ] Request rate spike (normal: 1000 req/min → 5000+)
  - [ ] API latency (normal: <100ms, expect: <200ms)
  - [ ] Error rate (should be: <0.1%)
  - [ ] Database connections (should be: 5-12 of 20)
  ```

- [ ] **Verify Live Streaming**
  ```
  Test with agent:
  - [ ] Agent dashboard loads
  - [ ] Stream provisioning works
  - [ ] Mux RTMP ingest connects
  - [ ] Stream appears in /api/basefm/live
  - [ ] Playback in frontend works
  ```

- [ ] **First User Activation**
  ```
  Coordinate with community:
  - [ ] First agent starts stream
  - [ ] Verify in monitoring
  - [ ] Announce in Discord
  - [ ] Screenshot for social media
  ```

### T+15 Min (00:15 UTC)

**Stabilization Phase**

- [ ] **Metrics Analysis**
  ```
  Check dashboards:
  - [ ] Grafana: System metrics normal
  - [ ] Prometheus: No alert spikes
  - [ ] Error rates: <0.5%
  - [ ] Latency: p95 < 200ms
  ```

- [ ] **Stream Quality Check**
  ```bash
  curl -s https://agentbot-api.onrender.com/api/basefm/live | jq '.[] | {id, status, quality}'
  ```
  - [ ] Streams connect
  - [ ] Audio quality acceptable
  - [ ] No stream drops

- [ ] **Database Load**
  ```bash
  # Check connection pool usage
  docker exec basefm-postgres-prod psql -U agentbot -d agentbot_db \
    -c "SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;"
  ```
  - [ ] Connections stable
  - [ ] No runaway queries

### T+30 Min (00:30 UTC)

**Expansion Phase**

- [ ] **Load Increase**
  ```
  Expected at this point:
  - Organic traffic increase
  - Social media amplification
  - Discord/community activity
  
  Monitor metrics for capacity:
  - [ ] API latency still <200ms
  - [ ] Database connections <15
  - [ ] Error rate <1%
  ```

- [ ] **Additional Content Publishing**
  ```
  Release next batch:
  - [ ] Dev.to article (if scheduled)
  - [ ] Newsletter send
  - [ ] TikTok/short-form content
  ```

- [ ] **Community Engagement**
  ```
  Active participation:
  - [ ] Discord: Welcome new users
  - [ ] Twitter: Engage with replies
  - [ ] Review first feedback
  ```

### T+60 Min (01:00 UTC)

**First Hour Wrap-up**

- [ ] **Metrics Report**
  ```
  Summarize first hour:
  - Peak request rate: ___ req/min
  - Average latency: ___ ms
  - Error rate: ___ %
  - Active streams: ___
  - Unique visitors: ___
  ```

- [ ] **Status Update**
  ```
  Post to #launch-day:
  "✅ First hour complete! All systems healthy.
   - Requests: 10K+
   - Latency: 95ms (p95)
   - Errors: 0.02%
   - Live streams: 5+
   - Standing by for continued monitoring."
  ```

- [ ] **Team Debrief** (Optional)
  ```
  If all healthy:
  - Brief pause for celebration
  - Confirm monitoring schedule
  - Everyone grab coffee ☕
  ```

---

## FIRST 24 HOURS MONITORING

### Hour 1-2 (Most Critical)

**Frequency:** Monitor every 5 minutes

```bash
#!/bin/bash
# Quick health check script

echo "=== BASEFM LAUNCH HEALTH CHECK ==="
echo "Time: $(date)"

# API Health
HEALTH=$(curl -s -w "%{http_code}" https://agentbot-api.onrender.com/health)
echo "API Health: $HEALTH"

# Database
DB_CONN=$(curl -s https://agentbot-api.onrender.com/metrics | grep 'db_connections' | head -1)
echo "DB Connections: $DB_CONN"

# Error Rate
ERRORS=$(curl -s https://agentbot-api.onrender.com/metrics | grep 'errors_total' | head -1)
echo "Error Rate: $ERRORS"

# Active Streams
STREAMS=$(curl -s https://agentbot-api.onrender.com/api/basefm/live | jq 'length')
echo "Active Streams: $STREAMS"

echo ""
```

**Target Metrics:**
- API response: 200 OK
- Latency: <100ms
- Error rate: <0.1%
- Active streams: >3

**If anything abnormal:**
→ Page on-call engineer immediately

### Hour 2-6 (Sustained Operations)

**Frequency:** Monitor every 15 minutes

**Watch For:**
- [ ] Memory creep (should stay <500MB for api)
- [ ] Database connections (should stay <12 of 20)
- [ ] Cache hit rate (should be >80%)
- [ ] Error rate trending (should stay flat)
- [ ] Request rate stabilizing

**Actions if issues:**
```
If memory increasing:
  → Check for memory leaks
  → Review recent logs
  → Consider restart if >80% usage

If error rate increasing:
  → Check error logs
  → Verify database connectivity
  → Check for external dependencies down (Mux, etc)

If latency spiking:
  → Check database query times
  → Monitor Redis performance
  → Review resource utilization
```

### Hour 6-24 (Extended Monitoring)

**Frequency:** Monitor every hour + alert-driven

**Maintenance Tasks:**
- [ ] 6h: Check backup success
- [ ] 12h: Verify database integrity
- [ ] 18h: Check disk usage
- [ ] 24h: Generate 24-hour report

**Overnight Procedure** (if during sleeping hours):
```
Setup:
- [ ] Alerts enabled
- [ ] Slack on loud
- [ ] PagerDuty on-call
- [ ] Phone notifications on

Team:
- [ ] Designate night watch (1 person)
- [ ] Others available for escalation
- [ ] Emergency contact list visible
```

---

## COMMON ISSUES & SOLUTIONS

### Issue: High Error Rate (>1%)

**Detection:**
- Monitoring alert fires
- User complaints in Discord
- Error logs growing

**Quick Diagnosis:**

```bash
# Check error logs
docker logs basefm-api-prod --tail=100 | grep -i error

# Check database
docker exec basefm-postgres-prod pg_isready

# Check Redis
docker exec basefm-redis-prod redis-cli ping

# Check Render status
curl -s https://status.render.com/ | grep -i "Incident"
```

**Solutions:**

```bash
# If database issue:
# Render auto-failover or manual restart
docker-compose -f docker-compose.production.yml restart api

# If Redis issue:
docker-compose -f docker-compose.production.yml restart redis

# If code issue:
git revert <last-commit>
git push origin main
# Render auto-redeploys

# If external issue (Mux down):
# Wait and monitor, no action needed
# Post status update to community
```

**Expected Recovery:** 2-5 min

---

### Issue: API Latency Spike (>200ms p95)

**Detection:**
- Monitoring alert fires
- Users report slowness
- Dashboard shows p95 > 200ms

**Diagnosis:**

```bash
# Check database query times
docker logs basefm-postgres-prod | grep "duration:"

# Check Redis hit rate
docker exec basefm-redis-prod redis-cli INFO stats | grep hit_rate

# Check system resources
docker stats basefm-api-prod

# Check request volume
curl -s https://agentbot-api.onrender.com/metrics | grep 'requests_total'
```

**Solutions:**

```bash
# If database slow:
# Add database connection pool
# Or optimize slow queries

# If Redis low hit rate (<70%):
# Increase Redis memory
docker-compose -f docker-compose.production.yml down
# Edit docker-compose.production.yml: maxmemory: 1024mb
docker-compose -f docker-compose.production.yml up -d

# If resource exhausted:
# Scale up
docker-compose -f docker-compose.production.yml \
  up -d --scale api=2

# If request volume too high:
# Enable rate limiting
# Notify users of capacity
```

**Expected Recovery:** 5-10 min

---

### Issue: Mux Streams Not Working

**Detection:**
- Stream provisioning fails
- /api/provision returns error
- Users report "Stream not starting"

**Diagnosis:**

```bash
# Check Mux credentials
echo $MUX_TOKEN_ID
echo $MUX_TOKEN_SECRET

# Test Mux API
curl -X GET https://api.mux.com/health \
  -H "Authorization: Bearer $MUX_TOKEN_ID:$MUX_TOKEN_SECRET"

# Check Mux status
curl -s https://status.mux.com/ | grep Incident
```

**Solutions:**

```bash
# If credentials wrong/expired:
# 1. Generate new credentials from Mux dashboard
# 2. Update in Vercel environment variables
# 3. Redeploy frontend

# If Mux service down:
# Wait for Mux to recover
# Post status update: "Streaming temporarily unavailable"
# Setup backup streaming option

# If network issue:
docker exec basefm-api-prod \
  curl -v https://api.mux.com/health
```

**Expected Recovery:** 5-15 min (if Mux issue)

---

### Issue: Database Running Out of Space

**Detection:**
- Insert errors in logs
- Monitoring alert: "Disk > 90%"
- Database performance degrades

**Diagnosis:**

```bash
# Check disk usage
docker exec basefm-postgres-prod df -h

# Check database size
docker exec basefm-postgres-prod \
  psql -U agentbot -d agentbot_db -c \
  "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

**Solutions:**

```bash
# Quick cleanup
docker-compose -f docker-compose.production.yml logs --tail=0 > /dev/null
docker container prune -f
docker image prune -a -f

# Archive old logs
gzip /var/lib/postgresql/data/pg_log/*.log 2>/dev/null

# Expand volume (contact Render)
# "I need to expand PostgreSQL volume from 10GB to 25GB"

# Emergency: Backup and restore with cleanup
pg_dump ... | pg_restore ...
```

**Expected Recovery:** 10-30 min

---

### Issue: Unusual Traffic Pattern (Possible Attack)

**Detection:**
- Request rate 10x normal (1000 → 10,000 req/sec)
- 90% requests from single IP or subnet
- Bot-like behavior patterns

**Diagnosis:**

```bash
# Check request distribution
curl -s https://agentbot-api.onrender.com/metrics | grep 'requests_by_endpoint'

# Check geographic distribution
# Vercel Analytics → Geographic section

# Check error patterns
docker logs basefm-api-prod | tail -100 | grep -E '429|403|401'
```

**Solutions:**

```
Immediate (Vercel handles automatically):
✅ Rate limiting activated (100 req/min per IP)
✅ Bot detection enabled (Cloudflare)
✅ Auto-scaling up to 10 instances
✅ DDoS mitigation active

Manual actions:
[ ] Enable stricter rate limiting
[ ] Implement CAPTCHA (if needed)
[ ] Add firewall rules
[ ] Contact Vercel security team

Communication:
[ ] Post status: "Investigating elevated traffic"
[ ] Monitor for 15 min
[ ] Post all-clear when normal
```

**Expected Recovery:** Automatic (5-10 min) or Manual (15-30 min)

---

## ESCALATION PROCEDURES

### Level 1: Informational

**When:** Non-critical issues, informational alerts

**Action:**
- Log in #alerts-info
- No immediate action needed
- Review during business hours

---

### Level 2: Warning

**When:** Minor issues, performance degraded but operational

**Example:** Latency >200ms, error rate >0.5%, cache hit <70%

**Action:**
```
1. Investigate (5 min)
2. Post status in #launch-day
3. Implement solution
4. Monitor recovery (10 min)
5. Post resolution
```

**Escalate to Level 3 if:** Not resolved in 15 min

---

### Level 3: Critical

**When:** Major outage, data loss, security incident

**Example:** API down, database error, data corruption

**Trigger:** `🔴 CRITICAL ALERT`

**Action:**
```
1. Page on-call engineer IMMEDIATELY
   - Slack: @on-call
   - Phone: [phone number]
   - Pager: [PagerDuty]

2. Activate war room
   - Discord: #ops-critical
   - Conference: [Zoom link]

3. Incident commander takes lead
   - Document timeline
   - Coordinate team
   - Communicate with users

4. Execute recovery procedure
   - Reference DISASTER_RECOVERY_BACKUP_PLAN.md
   - Follow exact steps
   - Avoid ad-hoc changes

5. Post-incident review
   - Timeline
   - Root cause
   - Prevention measures
```

**Recovery SLA:** <15 min target

---

### Level 4: Catastrophic

**When:** Total platform failure, potential data loss

**Action:**
```
SAME AS LEVEL 3 PLUS:

1. CEO notification
2. Legal notification (if data loss)
3. Prepare public statement
4. Consider website status page update
5. Community communication plan
```

**Recovery SLA:** <30 min target

---

## POST-LAUNCH WEEK

### Day 1 (Mar 31)

**24-Hour Report:**
```
Launch Day Metrics:
- Peak requests: _____ req/min
- Average latency: _____ ms
- Error rate: _____ %
- Active streams: _____
- Unique visitors: _____
- Stream provisioning success: _____%

Incidents:
- Critical incidents: ___
- Recovery time: _____
- Data loss: _____

Notable events:
- [List any interesting events]

Community feedback:
- [Positive highlights]
- [Issues reported]
- [Feature requests]
```

### Day 2-3 (Apr 1-2)

**Post-Launch Review:**

- [ ] Incident postmortem (if any)
- [ ] Performance analysis
- [ ] Code optimization review
- [ ] Security audit
- [ ] Team retrospective

**Updates:**
- [ ] Apply pending security patches
- [ ] Optimize slow queries (if any)
- [ ] Scale infrastructure (if needed)
- [ ] Update documentation

### Day 4-7 (Apr 3-7)

**Stabilization:**

- [ ] Monitor for memory leaks (72-hour test)
- [ ] Verify backup retention policy
- [ ] Team rotation to normal schedule
- [ ] Plan next features/improvements

---

## FINAL CHECKLIST

### Day Before (Mar 30)
- [ ] All checklists completed
- [ ] Team trained and briefed
- [ ] On-call rotation assigned
- [ ] Communication channels ready
- [ ] Backups verified
- [ ] Code deployed and tested

### Launch Day (Mar 31)
- [ ] All systems up at T-0
- [ ] Team in war room
- [ ] Announcements published
- [ ] Monitoring active
- [ ] First users engaged
- [ ] No critical issues

### Post-Launch (Apr 1+)
- [ ] 24-hour report completed
- [ ] Any incidents reviewed
- [ ] Team debrief held
- [ ] Lessons documented
- [ ] Normal operations resumed

---

## CONTACT INFORMATION

**Keep This Updated:**

```
PRIMARY ON-CALL:
Name: _______________
Phone: _______________
Email: _______________
Slack: _______________

SECONDARY ON-CALL:
Name: _______________
Phone: _______________
Email: _______________

DATABASE EXPERT:
Name: _______________
Phone: _______________

DEVOPS EXPERT:
Name: _______________
Phone: _______________

PLATFORM OWNER:
Name: _______________
Phone: _______________

EMERGENCY ESCALATION:
CEO: _______________
Lawyer: _______________
PR: _______________

EXTERNAL SUPPORT:
Render: support@render.com
Vercel: support@vercel.com
Mux: support@mux.com
AWS: support.aws.amazon.com
```

---

## CONCLUSION

You're ready. All systems prepared. Team trained. Procedures documented.

**March 31, 2026: Let's launch baseFM! 🚀**

---

**Prepared By:** Gordon (Infrastructure Expert)  
**Date:** March 14, 2026  
**Status:** ✅ READY FOR LAUNCH
