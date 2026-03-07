# Minimal Sentry Setup

## 1. Create Sentry Account (Free)

Go to https://sentry.io → Sign up → Create project

## 2. Get DSN

Projects → Your Project → Settings → Client Keys (DSN)

Copy the DSN key

## 3. Add to .env.production

```
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN@sentry.io/PROJECT_ID
```

## 4. Install Package

```bash
npm install @sentry/nextjs
```

## 5. Init in Next.js

Add to `web/app/layout.tsx`:

```typescript
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
```

## That's it

- Errors auto-captured
- Logs go to Sentry dashboard
- Free tier covers needs

Done.
