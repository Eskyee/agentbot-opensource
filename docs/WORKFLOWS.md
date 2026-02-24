# Agentbot Development Workflows

## Automated Systems

### Daily Blog Publishing
- **Schedule**: 9am UK London time daily
- **Automation**: GitHub Actions + OpenAI GPT-4o-mini
- **Content**: Platform updates, OpenClaw news, tutorials
- **Documentation**: [AUTOMATED_BLOG.md](./AUTOMATED_BLOG.md)

### Continuous Deployment
- **Platform**: Vercel
- **Trigger**: Push to `main` branch
- **Build Time**: ~28 seconds
- **Pages**: 46 static + dynamic routes

## Development Process

### 1. Local Development
```bash
cd web
npm install
npm run dev
```

### 2. Making Changes
```bash
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

### 3. Deployment
- Push to `main` branch
- Vercel auto-deploys
- Check deployment at: https://vercel.com/raveculture-projects/agentbot

## Key Technologies

### Frontend
- **Framework**: Next.js 16.1.6 (Turbopack)
- **Styling**: Tailwind CSS + Geist Design System
- **Fonts**: Geist Sans & Geist Mono
- **Auth**: NextAuth.js

### Backend
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Stripe
- **Email**: Resend
- **Hosting**: Vercel (web) + Railway (agents)

### AI Integration
- **Models**: GPT-4o, Claude 3.5, Gemini 1.5 Pro, Groq Llama
- **Framework**: OpenClaw
- **Deployment**: Railway containers

## Environment Variables

### Required for Local Development
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RAILWAY_API_KEY=
```

### Required for GitHub Actions
```
OPENAI_API_KEY - For automated blog generation
```

## Build Process

### Production Build
1. Install dependencies (2s)
2. Generate Prisma Client (100ms)
3. Next.js build with Turbopack (11s)
4. TypeScript compilation (10s)
5. Static page generation (470ms)
6. Deploy to Vercel (8s)

**Total**: ~28 seconds

### Build Output
- 46 pages total
- 37 static pages (○)
- 9 dynamic API routes (ƒ)
- 9 blog post pages

## Quality Checks

### Pre-commit
- ESLint for code quality
- TypeScript type checking
- Prettier for formatting

### Pre-deploy
- Build succeeds
- No TypeScript errors
- All routes accessible

## Monitoring

### Vercel Dashboard
- Deployment status
- Build logs
- Performance metrics
- Error tracking

### GitHub Actions
- Workflow runs
- Blog generation logs
- Automated deployments

## Support

### Documentation
- [Automated Blog System](./AUTOMATED_BLOG.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Resources
- Vercel: https://vercel.com/raveculture-projects/agentbot
- GitHub: https://github.com/Eskyee/agentbot
- Production: https://agentbot.raveculture.xyz
