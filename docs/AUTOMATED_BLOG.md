# Automated Blog System

## Overview
Agentbot automatically publishes fresh blog content daily at **9am UK London time** using GitHub Actions and AI.

## How It Works

### 1. Daily Schedule
- GitHub Actions workflow runs at 9am UK time
- Fetches latest updates from OpenClaw GitHub (commits & releases)
- Generates blog post using GPT-4o-mini
- Auto-commits and pushes to main branch
- Vercel auto-deploys the new post

### 2. Content Sources
- **OpenClaw Updates**: Latest commits and releases from GitHub
- **Platform News**: Agentbot improvements and features
- **Best Practices**: Deployment tips and tutorials
- **Industry Trends**: AI agent ecosystem updates

### 3. Post Topics
Each day covers one of:
- Platform improvements or new features
- AI agent deployment tips
- OpenClaw framework updates
- Tutorial or how-to guide
- Best practices for production agents

## Setup

### Required GitHub Secret
Add your OpenAI API key to GitHub repository secrets:

1. Go to: https://github.com/Eskyee/agentbot/settings/secrets/actions
2. Click "New repository secret"
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (starts with `sk-`)
5. Click "Add secret"

### Files
- `.github/workflows/daily-blog.yml` - GitHub Actions workflow
- `scripts/generate-daily-blog.js` - Blog generation script
- `web/app/blog/posts/` - Individual blog post pages
- `web/app/blog/page.tsx` - Blog index

## Manual Trigger
You can manually trigger a blog post generation:

1. Go to: https://github.com/Eskyee/agentbot/actions/workflows/daily-blog.yml
2. Click "Run workflow"
3. Select branch: `main`
4. Click "Run workflow"

## Post Format
Each post includes:
- Date and title
- 2 relevant tags
- Full content with headings, paragraphs, and bullet lists
- Call-to-action at the bottom
- Automatic addition to blog index

## Monitoring
- Check GitHub Actions tab for workflow runs
- View deployment logs in Vercel dashboard
- Blog posts appear at: https://agentbot.raveculture.xyz/blog

## Troubleshooting

### Workflow Not Running
- Verify `OPENAI_API_KEY` secret is set
- Check GitHub Actions is enabled for the repository
- Review workflow logs for errors

### Build Failures
- Ensure special characters are escaped in JSX (`'` → `&apos;`, `>` → `&gt;`)
- Check for syntax errors in generated content
- Review Vercel deployment logs

### OpenClaw API Issues
- Script gracefully handles API failures
- Falls back to general content if GitHub API is unavailable
- No action needed - next run will retry

## Content Guidelines
Generated posts follow:
- 300-500 words length
- Technical but accessible tone
- Markdown formatting with proper headings
- Bullet lists for key points
- Actionable takeaways

## Future Improvements
- [ ] Add RSS feed
- [ ] Email newsletter integration
- [ ] Social media auto-posting
- [ ] Analytics tracking
- [ ] SEO optimization
