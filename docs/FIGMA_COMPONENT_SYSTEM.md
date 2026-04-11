# Agentbot UI System

## Why This Exists

Agentbot is moving fast.

That is good for momentum, but it also means features can land as one-off UI slices unless we give them a shared system to snap to.

The goal is simple:
- faster delivery
- fewer regressions
- clearer reuse
- easier maintenance
- less “every page is its own little app”

This is the handoff doc for the design-system / Figma pass and the matching component structure in the repo.

## Principle

Design once.
Componentize once.
Ship many times.

We do not want every new feature to invent:
- its own shell
- its own section headers
- its own status badges
- its own form layouts
- its own card patterns

## Current Reality

The repo already has good foundations:

### Foundation UI
Path:
- `web/app/components/ui/*`

This is the primitive layer:
- button
- input
- badge
- card
- dialog
- table
- tabs
- select
- alert
- tooltip
- sheet
- skeleton

These should remain the lowest-level building blocks.

### Shared Product Patterns
Path:
- `web/app/components/shared/*`

This is the reusable product-shell layer:
- `DashboardShell`
- `SectionHeader`
- `StatusPill`
- `StatusBadge`
- `MetricCard`
- `EmptyState`
- `StepProgress`
- `ConfirmDialog`
- `PermissionGate`

This is where Agentbot’s repeating application patterns should live.

### Domain Components
Current examples:
- `web/app/components/basefm/*`
- `web/app/components/dashboard/*`
- `web/app/components/community/*`
- `web/app/components/landing/*`

These should stay domain-specific, but they should be built out of the foundation and shared layers instead of inventing fresh patterns every time.

## Recommended Figma Structure

Create a Figma file with these pages:

### 1. Foundations
- color tokens
- typography scale
- spacing scale
- radius rules
- shadows
- borders
- icon sizing
- motion rules

### 2. Primitives
- buttons
- inputs
- selects
- badges
- pills
- cards
- tables
- dialogs
- sheets
- tooltips
- loaders

### 3. Product Patterns
- dashboard shell
- page header
- section header
- metric card
- status row
- empty state
- confirmation modal
- step progress
- permission gate state

### 4. Domain Kits
- BaseFM
- Dashboard
- Community
- Landing / Marketing

Each domain kit should only assemble from the first three pages.

### 5. Screens
- current live screens
- new feature screens
- mobile views
- desktop views

## Rules For Componentization

### Rule 1: primitives stay dumb

Primitives should not know about product logic.

Examples:
- `Button` should not know what a DJ stream is
- `Badge` should not know what BaseFM access means

### Rule 2: shared patterns hold app-wide structure

If the same pattern shows up in 3+ places, it belongs in `shared/`.

Examples:
- page shells
- metric cards
- status displays
- section titles
- step flows

### Rule 3: domain components compose, they do not reinvent

BaseFM, Dashboard, Community, Landing, and future product areas should be built from:
- `ui/`
- `shared/`

and only keep domain-specific logic locally.

### Rule 4: mobile is not optional

Every componentized feature should define:
- mobile spacing
- desktop spacing
- overflow behavior
- long-text behavior
- empty/loading/error states

### Rule 5: status states are first-class

For every serious feature, design all of:
- loading
- empty
- active
- success
- warning
- error
- offline / degraded

This matters more than the happy-path mock.

## Immediate Component Targets

These are the best candidates to standardize next:

### Tier 1
- dashboard feature page layout
- feature step flows
- status panels
- action bars
- result blocks / “stream ready” panels

### Tier 2
- player wrappers
- token access panels
- integration setup cards
- settings blocks
- data tables with inline status

### Tier 3
- marketing hero variants
- social proof blocks
- comparison sections
- launch/update announcement modules

## Repo Structure Going Forward

Preferred structure:

```text
web/app/components/
  ui/           # primitives
  shared/       # app-wide reusable patterns
  system/       # stable import surface / docs entrypoint
  basefm/       # BaseFM domain components
  dashboard/    # dashboard-only domain components
  community/    # community-only domain components
  landing/      # marketing-only domain components
```

## Delivery Standard

A feature is “componentized” when:
- it uses existing primitives first
- repeated structures are pulled into shared patterns
- mobile/desktop states are designed
- loading/error/empty states exist
- the next feature can reuse the same blocks

## First Practical Outcome

The first outcome of this system should be:
- faster feature shipping without visual drift
- easier maintenance of dashboard pages
- BaseFM and dashboard experiences feeling like the same product

That is the point.
