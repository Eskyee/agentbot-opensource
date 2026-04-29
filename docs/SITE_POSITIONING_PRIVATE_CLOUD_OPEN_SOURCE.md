# Agentbot Site Positioning

## Visual Source Of Truth

All visual execution must follow:

- [web/DESIGN_SYSTEM.md](/Users/raveculture/Documents/GitHub/agentbot/web/DESIGN_SYSTEM.md)

That file is the enforced UI system.

The positioning in this document defines product framing and information architecture.
It does **not** override the design rules in `web/DESIGN_SYSTEM.md`.

Key non-negotiables from the design guide:

- dark-first surfaces
- `font-mono` as the default product and marketing typography
- uppercase headings and metadata
- rectangular buttons and cards
- no gradients
- no shadows
- no rounded layout elements
- `zinc-*` palette instead of `gray-*`
- section rhythm based on `border-t border-zinc-900`
- `/wristband` is the visual gold standard

## Core Split

Agentbot should be presented as two clear product lanes:

1. **Production Private Cloud**
2. **Open Source / Self-Hosted**

This is the cleanest way to match the actual product, docs, and platform story.

## Production Private Cloud

Position this as the default path for teams that want:

- managed deployment
- private infrastructure
- production support
- faster onboarding
- hosted dashboards and operations
- Agentbot + OpenClaw as a managed runtime

Recommended language:

- `Deploy your agent stack to a production private cloud.`
- `Managed runtime for creative crews, business automation, and operator dashboards.`
- `Private cloud, BYOK models, onchain payments, and production operations out of the box.`

Proof points to emphasize:

- Vercel web app
- Railway control plane and managed runtime
- BYOK model routing
- dashboard and fleet control
- x402 / USDC payments
- OpenClaw business operations

## Open Source / Self-Hosted

Position this as the path for builders and infra-native teams that want:

- source access
- self-hosting
- extensibility
- local control
- no vendor lock-in

Recommended language:

- `Open source agent infrastructure you can fork, run, and extend.`
- `Self-host Agentbot from day one.`
- `Own your agents, keys, runtime, and data.`

Proof points to emphasize:

- MIT open source mirror
- self-host documentation
- architecture docs
- cryptographic identity / DID direction
- developer docs
- reusable skills and APIs

## Recommended Site IA

Top-level marketing flow should be:

1. Hero
2. Product split: `Private Cloud` vs `Open Source`
3. Agentbot + OpenClaw architecture
4. Core capabilities
5. Dashboard / command center preview
6. Pricing for managed product
7. Developer docs and self-host entry points
8. Final CTA

## Recommended Homepage Section Copy

### Hero

Headline:

`Production AI agents for private cloud teams. Open source for everyone else.`

Subhead:

`Run Agentbot as a managed private-cloud control plane, or fork the open-source stack and self-host it yourself.`

Primary CTAs:

- `Deploy Private Cloud`
- `View Open Source`

Secondary CTA:

- `Read Docs`

### Product Split

Card 1:

- Title: `Production Private Cloud`
- Copy: `Managed Agentbot + OpenClaw runtime with dashboards, BYOK model routing, payments, and operator tooling.`

Card 2:

- Title: `Open Source`
- Copy: `Fork the stack, self-host the runtime, extend the skills, and own the full system.`

### Architecture Section

Frame the product as:

- `Agentbot` for creative and front-of-house automation
- `OpenClaw` for business operations and back-office execution
- `Command Center` for operator visibility and control

## Docs Navigation Recommendation

Docs should separate:

- `Private Cloud Docs`
- `Open Source Docs`
- `Developer Docs`
- `Operator Docs`

Suggested quick links:

- `Deploy to Private Cloud`
- `Self-Host Agentbot`
- `Architecture`
- `API + Skills`
- `Pricing + Plans`

## Figma / Component Implications

The design file should add:

- a `Product Split` section pattern
- comparison cards for managed vs self-hosted
- docs entry cards
- operator / developer / builder badge variants
- infrastructure status and deployment state patterns

Recommended Figma page structure:

1. `Foundations`
2. `Primitives`
3. `Product Patterns`
4. `Domain Kits`
5. `Screens`

Inside `Product Patterns`, include:

- product split cards
- deployment option selector
- docs entry cards
- status rows
- pricing cards
- dashboard shell

All of those patterns should be rendered in the exact style language from `web/DESIGN_SYSTEM.md`, especially:

- rectangular buttons
- no pill badges
- no rounded cards
- no decorative gradients
- mono-forward typography
- tight label system using `text-[10px] uppercase tracking-widest`

## Positioning Rule

Do not present Agentbot as only:

- a generic chatbot
- a simple landing-page SaaS
- an open-source toy

It is a dual-offering platform:

- **managed production private cloud**
- **open source self-hosted stack**

That split should be visible in the hero, navigation, docs, pricing context, and screenshots.
