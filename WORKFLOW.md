# Your Workflow - Keep It Simple

## Before Every Commit

```bash
cd ~/Documents/GitHub/agentbot/web
npm run build
# Wait for success ✓
git add .
git commit -m "your message"
cd ..
git push origin main
```

## If Build Fails Locally
- Check stderr for error type
- Look up error in `BUILD_ERRORS_LOG.md`
- Fix it
- Run `npm run build` again
- Only push when local build passes ✅

## Vercel Will Auto-Deploy
- After you push to main
- Watch it at https://vercel.com/agentbot-raveculture-xyz
- Should pass in ~1-2 mins if local build passed

## That's It
Don't overthink it. Build locally → Push → Done.
