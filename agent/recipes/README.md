# Eve Recipes (from agentcn)

Ready-to-use Eve agent recipes from [agentcn](https://www.agentcn.run) (`shadcn-labs/agentcn`), vendored here verbatim.

Each recipe is **self-contained** under `agent/recipes/<name>/` and is **not** auto-loaded by the live agent — it won't affect `eve.agentbot.sh` until you activate it.

## Activating a recipe

A recipe's files mirror the agent layout (`agent.ts`, `instructions.md`, `tools/`, `skills/`, `lib/`). To enable one:

1. Copy its `tools/*` into `agent/tools/` and any `skills/*` into `agent/skills/` (eve auto-discovers these).
2. Fold its `instructions.md` guidance into `agent/instructions.md`.
3. Install the recipe's npm **deps** and set its **env vars** (see below).

Or install fresh from the registry (overwrites `agent.ts` + `instructions.md`):

```bash
npx shadcn@latest add @agentcn/eve/<name>
```

> Note: `lib/vector-store.ts` and `tools/web_search.ts` differ between recipes, which is why recipes are kept in separate folders rather than merged.

## Catalog

| Recipe | Description | npm deps | Env vars |
|--------|-------------|----------|----------|
| `browser-agent` | Eve agent that drives a real browser with Playwright using a snapshot-and-selector pattern to complete web tasks. | `playwright` | `BROWSER_CDP_URL`, `BROWSER_HEADLESS` |
| `chat-with-pdf` | Eve agent that indexes a PDF into a vector store and answers questions over it with page-cited retrieval. | `@libsql/client`, `@ai-sdk/openai`, `ai`, `unpdf` | `LIBSQL_URL` |
| `chat-with-youtube` | Eve agent that fetches a video's metadata and transcript, then answers questions with clickable timestamp citations. | `youtube-transcript` | — |
| `claw` | Eve agent that operates a sandboxed workspace — read/write files and run shell commands — to finish multi-step tasks. | — | `WORKSPACE_DIR` |
| `company-knowledge` | Eve agent that indexes internal documents into a vector store and answers questions over them, with PII redaction. | `@libsql/client`, `@ai-sdk/openai`, `ai` | `LIBSQL_URL` |
| `csv-to-questions` | Eve agent that summarizes a CSV dataset to stay within token limits, then generates focused analytical questions. | — | — |
| `deep-search` | Eve agent that researches a question, evaluates its own findings, and iterates until the answer is complete and cited. | — | `EXA_API_KEY` |
| `docs-chatbot` | Eve agent that answers questions about a library's functions by looking up structured documentation. | — | — |
| `docs-expert` | Eve agent that answers questions about libraries and APIs by searching the live web and citing sources. | — | `EXA_API_KEY` |
| `feedback-summary` | Eve agent that retrieves, categorizes, and summarizes customer feedback into an executive report with recommendations. | — | `FEEDBACK_API_URL` |
| `flashcards-pdf` | Eve agent that turns a PDF into study flash cards, with optional AI-generated images per concept. | `unpdf` | `OPENAI_API_KEY` |
| `github-review` | Eve agent that fetches a GitHub pull request and returns adaptive, file-by-file code review feedback. | — | `GITHUB_TOKEN` |
| `google-sheets` | Eve agent that reads, analyzes, and edits Google Sheets via the Sheets API. | — | `GOOGLE_ACCESS_TOKEN` |
| `meeting-notes` | Eve agent that turns a raw meeting transcript into a structured summary, decisions, and action items. | — | — |
| `slack-agent` | Eve agent that replies to Slack mentions and DMs, threaded, via the Slack Web API. | — | `SLACK_BOT_TOKEN` |
| `text-to-sql` | Eve agent that introspects a database schema, converts questions to SQL, and runs read-only queries. | `@libsql/client` | `DATABASE_URL` |
| `weather` | Eve agent that looks up current weather for a location via the Open-Meteo API. | — | — |
