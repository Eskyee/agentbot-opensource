---
task: Technical SEO audit of agentbot.raveculture.xyz
slug: 20260314-000001_seo-audit-agentbot
effort: standard
phase: complete
progress: 28/28
mode: interactive
started: 2026-03-14T00:00:01Z
updated: 2026-03-14T00:02:00Z
---

## Context

Full technical SEO audit of agentbot.raveculture.xyz across 4 pages + sitemap + robots.txt.
Pages fetched: homepage, /pricing, /docs, /why.

### Risks
- WebFetch returns rendered markdown, not raw HTML — some meta tags may be inferred rather than exact
- The /docs page appears to be using the homepage title/OG tags (shared metadata pattern issue)
- og:url on /docs points to homepage (https://agentbot.raveculture.xyz) not /docs

## Criteria

- [x] ISC-1: Homepage title tag present and retrieved
- [x] ISC-2: Homepage title under 60 chars
- [x] ISC-3: Homepage meta description present and retrieved
- [x] ISC-4: Homepage meta description character count assessed
- [x] ISC-5: Homepage H1 audited
- [x] ISC-6: Homepage OG tags present
- [x] ISC-7: Homepage Twitter card tags present
- [x] ISC-8: Homepage JSON-LD present and type identified
- [x] ISC-9: Homepage canonical tag status assessed
- [x] ISC-10: Pricing title tag audited
- [x] ISC-11: Pricing meta description audited
- [x] ISC-12: Pricing H1 audited
- [x] ISC-13: Pricing OG/Twitter tags audited
- [x] ISC-14: Pricing JSON-LD audited
- [x] ISC-15: Pricing canonical audited
- [x] ISC-16: /docs title audited (duplicate of homepage)
- [x] ISC-17: /docs H1 audited
- [x] ISC-18: /docs canonical audited (missing)
- [x] ISC-19: /why title audited (duplicate of homepage)
- [x] ISC-20: /why H1 audited
- [x] ISC-21: /why canonical audited (missing)
- [x] ISC-22: Twitter tags on /pricing audited (using homepage values)
- [x] ISC-23: Sitemap URL coverage assessed
- [x] ISC-24: /why missing from sitemap flagged
- [x] ISC-25: Sitemap lastmod dates absence flagged
- [x] ISC-26: robots.txt directives assessed
- [x] ISC-27: robots.txt missing Disallow for /dashboard assessed
- [x] ISC-28: Keyword opportunities for UK AI agent SaaS identified

## Decisions

- Classified /docs og:url pointing to homepage as a P0 bug (wrong canonical signal to Google)
- Classified missing canonical on homepage and /why as P1
- Classified /why missing from sitemap as P1
- Classified robots.txt missing Disallow for /dashboard as P1

## Verification

All 6 URLs fetched successfully. Data cross-checked for consistency.
