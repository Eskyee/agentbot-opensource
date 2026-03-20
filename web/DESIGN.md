# Agentbot Design System

## Color Palette

**Backgrounds:**
- Primary: `bg-black`
- Cards/surfaces: `bg-zinc-900`
- Elevated: `bg-zinc-800`

**Text:**
- Primary: `text-white`
- Secondary: `text-zinc-400`
- Tertiary: `text-zinc-500`
- Muted: `text-zinc-600`
- Ghost: `text-zinc-700`

**Accent:**
- Primary: `text-blue-500` / `bg-blue-500` / `border-blue-500`
- Hover: `hover:bg-blue-600`

**Borders:**
- Default: `border-zinc-800`
- Strong: `border-zinc-700`
- Dividers: `border-zinc-900`

**Buttons:**
- Primary: `bg-white text-black hover:bg-zinc-200`
- Secondary: `border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600`
- Destructive: `bg-red-600 text-white`

## Typography

- Font: `font-mono` (all pages)
- Headings: `font-bold tracking-tighter uppercase`
- Labels: `text-[10px] uppercase tracking-widest text-zinc-600`
- Body: `text-sm text-zinc-400 leading-relaxed`

## Rules

- **NEVER** use `gray-*` — always `zinc-*`
- **NEVER** use `purple-*` — always `blue-*`
- **ALWAYS** `font-mono` for page-level typography
- **ALWAYS** `tracking-widest` for labels, `tracking-tighter` for headings
- **ALWAYS** uppercase for headings and labels

## Enforcement

Before committing, run:
```bash
grep -rn 'gray-\|purple-' app/ --include="*.tsx" | grep -v node_modules
```
Must return zero results.
