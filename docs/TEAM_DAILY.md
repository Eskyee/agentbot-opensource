# Team Agentbot - Daily Workflow

## The Team

```
┌────────────────────────────────────────────────────────────────┐
│                        THE BOSS                                 │
│                    You (RaveCulture)                            │
│                  CEO & Decision Maker                           │
└────────────────────────────┬───────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     ATLAS       │  │    COPILOT      │  │    GORDON       │
│   (Mac mini)    │  │   (GitHub)      │  │   (Docker)      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Local AI Agent  │  │ Code Review     │  │ Production      │
│ - Gemini 3      │  │ - PR Reviews    │  │ - User Agents   │
│ - Telegram      │  │ - Automation    │  │ - Isolation     │
│ - Voice         │  │ - Daily Blog    │  │ - Scaling       │
│ - Commands      │  │ - Testing       │  │ - Self-healing  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │     AGENTBOT       │
                  │     (Vercel)       │
                  ├─────────────────────┤
                  │ Cloud Platform     │
                  │ - Web UI           │
                  │ - API              │
                  │ - Stripe           │
                  │ - Database         │
                  └─────────────────────┘
```

## Daily Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        MORNING (9AM UK)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. GitHub Actions wakes up                                     │
│     └──→ Daily Blog Post generated (Copilot)                   │
│     └──→ Deployment Test runs                                   │
│     └──→ Report sent to You                                    │
│                                                                  │
│  2. Atlas checks in (Mac mini)                                 │
│     └──→ Health monitor active                                  │
│     └──→ Ready for commands                                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DAYTIME                                  │
├─────────────────────────────────────────────────────────────────┤
│  You make decisions                                             │
│     ↓                                                           │
│  Local dev on Mac (Atlas helps)                                │
│     ↓                                                           │
│  Push to GitHub                                                 │
│     ↓                                                           │
│  Copilot reviews PRs                                            │
│     ↓                                                           │
│  Auto-deploy to Vercel                                          │
│     ↓                                                           │
│  Agentbot live!                                                 │
│                                                                  │
│  Users sign up → Gordon spawns Docker container                 │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EVENING                                  │
├─────────────────────────────────────────────────────────────────┤
│  GitHub Actions runs nightly checks                             │
│  Logs aggregated                                                │
│  Ready for next day                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Who Does What

| Member | Role | Location | Handles |
|--------|------|----------|---------|
| **You** | CEO | Everywhere | Decisions, vision, money |
| **Atlas** | Chief of Staff | Mac mini (local) | Commands, tasks, voice, Telegram |
| **Copilot** | Developer | GitHub (cloud) | Code review, automation, testing |
| **Gordon** | Operations | Docker Hub (cloud) | User containers, production |
| **Agentbot** | Platform | Vercel (cloud) | Web, API, users, payments |

## Communication

```
You → Atlas (Telegram / Terminal)
You → Copilot (GitHub Issues / PRs)
You → Gordon (Docker Hub / Railway)
You → Agentbot (Web UI / API)

Atlas → Agentbot (API calls)
Copilot → GitHub (Auto)
Gordon → Agentbot (Health checks)
```

## Success Metrics

- ✅ Atlas responding
- ✅ Agentbot health = 200
- ✅ GitHub workflows passing
- ✅ No Docker failures
- ✅ User signups working
- ✅ Stripe payments processing
