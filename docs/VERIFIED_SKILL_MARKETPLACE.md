# Verified Skill Marketplace

This is the practical design for letting Agentbot users sell and buy skills without turning the marketplace into a malware channel.

## Product Rule

Discovery is easy.
Trust is hard.

So the market should optimize for:
- install confidence
- publisher accountability
- reversible rollout
- paid distribution only after verification

Not:
- “upload arbitrary code and let strangers run it”

## First Foundation

Agentbot now has:
- a marketplace safety scanner in [web/app/lib/skillMarketplaceSafety.ts](/Users/raveculture/Documents/GitHub/agentbot/web/app/lib/skillMarketplaceSafety.ts)
- a verification API in [web/app/api/skills/verify/route.ts](/Users/raveculture/Documents/GitHub/agentbot/web/app/api/skills/verify/route.ts)
- creation/install gating in:
  - [web/app/api/skills/create/route.ts](/Users/raveculture/Documents/GitHub/agentbot/web/app/api/skills/create/route.ts)
  - [web/app/api/skills/route.ts](/Users/raveculture/Documents/GitHub/agentbot/web/app/api/skills/route.ts)

Current scanner blocks obvious bad patterns:
- piped shell bootstraps
- eval / dynamic code execution
- child_process execution
- destructive shell commands
- direct env scraping

This is not sufficient on its own. It is only the first gate.

## Recommended Trust Ladder

### 1. Trusted

Reserved for:
- Agentbot-authored
- OpenClaw / official ecosystem publishers
- manually approved partners

Traits:
- auto-install allowed
- featured placement
- paid promotion allowed

### 2. Verified

Reserved for user skills that:
- have a real source URL
- pass static checks
- pass install/runtime review
- are bound to a verified publisher profile

Traits:
- install allowed
- visible trust badge
- purchasable

### 3. Review

Skills that:
- pass hard blocks
- but need human review

Traits:
- discoverable
- not auto-promoted
- not sellable until reviewed

### 4. Blocked

Skills that:
- match hard-risk patterns
- or violate marketplace policy

Traits:
- cannot be listed
- cannot be installed

## What To Build Next

### Seller Identity

Every seller should have:
- wallet
- DID / Gitlawb or GitHub profile
- public publisher page
- verification history

### Skill Records

Add marketplace metadata for:
- source URL
- verification status
- verification notes
- version history
- price
- publisher
- payout wallet

### Runtime Verification

Before a skill becomes sellable:
- install it in a clean test runtime
- run its declared setup path
- confirm it does not crash the agent
- confirm declared permissions match actual behavior

### Capability Permissions

Every skill should declare:
- network access
- filesystem access
- shell access
- wallet access
- external API use

Users should see this clearly before install.

### Paid Distribution

Don’t start with subscriptions.
Start with:
- one-time paid skill installs
- revenue split to publisher wallet
- Agentbot fee

Then add:
- maintenance subscription
- usage-based paid skills

## Why This Matters

Large skill/plugin marketplaces fail when:
- code is unverified
- publisher identity is weak
- install permissions are unclear
- users pay before trust exists

The market should feel closer to:
- verified plugin registry

than:
- random zip file bazaar

## External Notes

Relevant references:
- OpenClaw / ClawHub ecosystem direction:
  - https://docs.openclaw.ai/skills
- Skill marketplace security research:
  - SkillScanner (Alexa marketplace static analysis):
    https://arxiv.org/abs/2309.05867

The lesson is simple:
- static analysis catches obvious policy/security failures early
- but real trust also needs publisher identity and staged review
