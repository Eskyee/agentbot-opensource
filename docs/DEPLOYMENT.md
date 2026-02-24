# Deployment Guide

## Database Migration

The following migration needs to be applied to the production database:

```bash
cd web
npx prisma migrate deploy
```

This will apply the migration: `20260224124534_add_all_phase_features`

### Tables Added

1. **Skill** - Marketplace skills
2. **InstalledSkill** - User-installed skills
3. **AgentSwarm** - Multi-agent coordination
4. **Workflow** - Visual workflow definitions
5. **WorkflowNode** - Workflow nodes/steps

### Existing Tables (from Phase 1)

- **ScheduledTask** - Scheduled automation tasks
- **AgentMemory** - Agent memory persistence
- **AgentFile** - File storage metadata

## Vercel Deployment

The app auto-deploys on push to `main` branch.

### Post-Deployment Steps

1. **Run migration on Vercel Postgres**:
   - Go to Vercel Dashboard → Storage → Postgres
   - Run: `npx prisma migrate deploy`
   - Or use Vercel CLI: `vercel env pull && npx prisma migrate deploy`

2. **Verify deployment**:
   - Check `/dashboard/tasks` - Scheduled tasks
   - Check `/dashboard/skills` - Skill marketplace
   - Check `/dashboard/personality` - Custom personalities
   - Check `/dashboard/files` - File storage
   - Check `/dashboard/swarms` - Agent swarms
   - Check `/dashboard/workflows` - Workflow builder

3. **Seed sample data** (optional):
   ```bash
   node scripts/seed-skills.js
   ```

## Environment Variables

Required for production:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://agentbot.com
NEXTAUTH_SECRET=...
```

## Feature Flags

All features are enabled by default. To disable:

- Remove navigation items from `/app/dashboard/page.tsx`
- Comment out API routes in `/app/api/`

## Monitoring

- Check Vercel logs for errors
- Monitor database query performance
- Track API endpoint usage

## Rollback

If issues occur:

```bash
npx prisma migrate resolve --rolled-back 20260224124534_add_all_phase_features
```

## Support

- GitHub Issues: https://github.com/Eskyee/agentbot/issues
- Documentation: `/docs/ROADMAP.md`
