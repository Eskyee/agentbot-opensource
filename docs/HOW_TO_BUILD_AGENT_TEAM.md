# How to Build an Autonomous AI Agent Team

A step-by-step guide to building a 24/7 AI agent team that works while you sleep. Not theory — actual steps.

## Week 1: One Agent, One Job

### Day 1: Install & Configure (30 minutes)

1. **Deploy your agent**
   - Sign up at agentbot.sh
   - Start free trial (7 days, no credit card)
   - Your agent deploys in 60 seconds

2. **Connect Telegram**
   - Go to Settings → Channels
   - Add your Telegram bot token
   - Test: send "hello" to your bot

3. **Choose your first job**
   - Pick the most repetitive daily task
   - Good first jobs: research, email triage, content drafting
   - Bad first jobs: anything requiring creative judgment

### Day 2-3: Write Your SOUL.md (15 minutes)

Your SOUL.md defines your agent's personality and role.

**Template:**
```markdown
# SOUL.md

## Core Identity
**[Name]** — [one-line description]
[What makes this agent different]

## Your Role
[What you do, in 3-5 bullet points]

## Principles
1. [First principle]
2. [Second principle]
3. [Third principle]

## Output Format
[How you deliver results — consistent structure]
```

**Tips:**
- Keep it under 60 lines
- Be specific ("no emojis" > "be professional")
- Include what NOT to do
- Name your agent something memorable

### Day 4-5: Set Up Your Schedule (15 minutes)

Create your first cron job:
- Pick a time when you want results ready (e.g., 8 AM for morning research)
- Set the schedule: `0 8 * * *` (daily at 8 AM)
- The agent wakes up, does the work, delivers results

### Day 6-7: Observe & Refine

- Watch what your agent produces
- Give feedback: "too verbose" / "missing sources" / "great insight"
- Update SOUL.md based on feedback
- Update memory files with lessons learned

**Expected outcome:** Agent produces 70-80% useful output. The other 20% needs your feedback.

---

## Week 2: Add Memory & Refine

### What to do:

1. **Review daily memory files**
   - Check `memory/YYYY-MM-DD.md` after each run
   - Note patterns: what works, what doesn't
   - Update SOUL.md with corrections

2. **Create MEMORY.md**
   - Distill the most important lessons from daily logs
   - Keep it under 200 lines
   - Review and update weekly

3. **Set up heartbeat checks**
   - Add your agent's cron job IDs to HEARTBEAT.md
   - Heartbeat will verify jobs ran and force re-runs if stale

**Expected outcome:** Agent produces 85-90% useful output. You're giving less feedback.

---

## Week 3: Add a Second Agent

### When you know you need a second agent:

Your first agent is producing useful output, but you're still manually doing something with it. Example: research agent produces intel, but you're still manually writing tweets from it.

### How to add:

1. **Create the second agent's SOUL.md**
   - Different role from agent 1
   - Clear relationship to agent 1 ("reads output from...")
   - Different personality (use SOUL Template Library)

2. **Set up file-based coordination**
   - Agent 1 writes to: `intel/DAILY-INTEL.md`
   - Agent 2 reads from: `intel/DAILY-INTEL.md`
   - One writer, many readers. No conflicts.

3. **Schedule after agent 1**
   - Agent 1 runs at 8:00 AM
   - Agent 2 runs at 9:00 AM (after agent 1 finishes)
   - Never schedule dependent agents at the same time

**Expected outcome:** Two agents producing coordinated output. You're reviewing, not creating.

---

## Week 4+: Scale Sequentially

### When to add the next agent:

- You feel a real gap (not a theoretical one)
- Your current agents are producing enough that you need help processing
- You have a clear, specific job for the new agent

### How to scale:

1. **One agent per week maximum**
2. **Test each agent for a full week before adding another**
3. **Document what each agent does (and doesn't do)**
4. **Keep SOUL.md files under 60 lines each**

### Don't:

- ❌ Don't add 6 agents on day one
- ❌ Don't give one agent multiple jobs
- ❌ Don't skip the feedback/refinement loop
- ❌ Don't add agents for theoretical needs

---

## The File-Based Coordination Pattern

### How agents work together:

```
Dwight (Research)     → writes → intel/DAILY-INTEL.md
Kelly (X/Twitter)     → reads  → intel/DAILY-INTEL.md
Rachel (LinkedIn)     → reads  → intel/DAILY-INTEL.md
Pam (Newsletter)      → reads  → intel/DAILY-INTEL.md
```

### Rules:

1. **One writer per file** — nobody else writes to DAILY-INTEL.md
2. **Readers check timestamps** — don't read stale data
3. **Structured format** — consistent JSON/markdown so readers can parse
4. **Clear ownership** — each agent knows which files are theirs

### Example structure:

```
workspace/
├── SOUL.md                    # Main agent (Chief of Staff)
├── MEMORY.md                  # Main agent's long-term memory
├── HEARTBEAT.md               # Self-healing monitor
├── agents/
│   ├── researcher/
│   │   ├── SOUL.md
│   │   └── memory/
│   └── content/
│       ├── SOUL.md
│       └── memory/
├── intel/
│   ├── DAILY-INTEL.md         # Researcher writes, others read
│   └── data/
│       └── 2026-04-10.json    # Structured data (source of truth)
└── memory/
    └── 2026-04-10.md          # Daily raw logs
```

---

## Real Costs

### Solo (1 agent):
- Agentbot Solo: $29/mo
- AI model (MiMo/OpenRouter): ~$10-30/mo
- Telegram: Free
- **Total: ~$40-60/mo**

### Collective (3 agents):
- Agentbot Collective: $69/mo
- AI model: ~$30-60/mo
- **Total: ~$100-130/mo**

### Label (10 agents):
- Agentbot Label: $149/mo
- AI model: ~$100-200/mo
- **Total: ~$250-350/mo**

### Full team (unlimited):
- Agentbot Network: $499/mo
- AI model: ~$200-500/mo
- **Total: ~$700-1000/mo**

---

## What Actually Changes

### Week 1:
- Agent produces first output
- You give feedback, refine SOUL.md
- Learning curve (both you and the agent)

### Week 2:
- Agent produces consistent, useful output
- Less feedback needed
- You start trusting the output

### Month 1:
- Agent handles 80%+ of the task autonomously
- Memory files grow richer
- Output quality improves from corrections

### Month 3:
- Multiple agents coordinating
- Compound improvement from accumulated memory
- You spend 10 minutes reviewing instead of 2 hours creating

### Month 6:
- The system knows your preferences better than you do
- Agents anticipate your needs
- You think of them as team members, not tools

---

## Common Mistakes

1. **Too many agents too fast** — Start with one. Get it right. Then add.
2. **Vague SOUL.md** — "be helpful" is useless. "no emojis, short sentences, always cite sources" works.
3. **No feedback loop** — Agent quality plateaus without corrections. Give feedback daily.
4. **Wrong schedule** — Don't schedule dependent agents at the same time.
5. **No memory maintenance** — Review and distill memory files weekly. Clutter degrades quality.
6. **Too many tools** — Start with basic tools. Add complexity only when needed.

---

## The Mental Shift

Something changes when your agents have been running for a month.

You stop thinking of AI as a tool you open when you need something. You start thinking of it as a team that is always working.

The models are table stakes. Everyone has access to Claude, GPT, Gemini. The alpha comes from the systems around the model. The SOUL.md files. The memory. The scheduling. The coordination patterns. The weeks of corrective feedback stored in files.

That system is yours. Nobody else has your agents, your memory files, your refined personalities.

And it compounds every day.

---

**Start today. One agent. One job. One schedule.**

Get started at agentbot.sh →
