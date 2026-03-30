# Agentbot Design System

**Version:** 1.0.0
**Last Updated:** 2026-03-20
**Status:** Production — Enforced
**Framework:** Next.js 15 + Tailwind CSS 3 + Geist Font Family
**Reference Page:** `src/components`

---

## 1. Principles

1. **Dark-first.** Every surface is black or near-black. Light elements are used only for primary actions.
2. **Monospace DNA.** All marketing, product, and dashboard pages use `font-mono` (Geist Mono). The sans variant is reserved for body-heavy documentation.
3. **No decoration.** No gradients, no drop shadows, no border-radius on layout elements, no emojis in UI chrome.
4. **Information density.** Small type, uppercase labels, generous whitespace. Let the content breathe.
5. **Vercel cadence.** Sections are stacked vertically, separated by `border-t border-zinc-900` hairlines. No card grids unless showing pricing or data.

---

## 2. Color Palette

### 2.1 Backgrounds

| Token          | Value     | Tailwind Class | Usage                        |
| -------------- | --------- | -------------- | ---------------------------- |
| `--bg-primary` | `#000000` | `bg-black`     | Page background, body        |
| `--bg-surface` | `#18181b` | `bg-zinc-900`  | Cards, inputs, sidebar       |
| `--bg-raised`  | `#27272a` | `bg-zinc-800`  | Hover states, nested panels  |
| `--bg-inset`   | `#09090b` | `bg-zinc-950`  | Sidebar, overlay backgrounds |

### 2.2 Foreground / Text

| Token        | Value     | Tailwind Class   | Usage                              |
| ------------ | --------- | ---------------- | ---------------------------------- |
| `--fg-1`     | `#ffffff` | `text-white`     | Headings, primary text             |
| `--fg-2`     | `#a1a1aa` | `text-zinc-400`  | Body copy, descriptions            |
| `--fg-3`     | `#71717a` | `text-zinc-500`  | Secondary text, nav links          |
| `--fg-4`     | `#52525b` | `text-zinc-600`  | Labels, metadata, dates            |
| `--fg-muted` | `#3f3f46` | `text-zinc-700`  | Subtitle accent in headings        |
| `--fg-ghost` | `#27272a` | `text-zinc-800`  | Decorative / extremely low-contrast|

### 2.3 Borders

| Token            | Value     | Tailwind Class       | Usage                    |
| ---------------- | --------- | -------------------- | ------------------------ |
| `--border-1`     | `#18181b` | `border-zinc-900`    | Section dividers, cards  |
| `--border-2`     | `#27272a` | `border-zinc-800`    | Input borders, card edges|
| `--border-3`     | `#3f3f46` | `border-zinc-700`    | Hover borders            |

### 2.4 Accent

| Token         | Value     | Tailwind Class  | Usage                       |
| ------------- | --------- | --------------- | --------------------------- |
| `--accent`    | `#3b82f6` | `text-blue-500` | Badge text, active states   |
| `--accent-bg` | `#3b82f6/30` | `bg-blue-500/30` | Selection highlight      |

### 2.5 Semantic

| Purpose  | Tailwind Class          | Usage               |
| -------- | ----------------------- | -------------------- |
| Success  | `text-green-400`        | Status dots, online  |
| Danger   | `text-red-400`          | Destructive actions  |
| Warning  | `text-yellow-400`       | Caution states       |

### 2.6 Forbidden Colors

**NEVER use in production code:**
- `gray-*` (Tailwind default gray) -- use `zinc-*` exclusively
- Any `bg-gradient-to-*` on cards, sections, or containers
- `blue-600`, `green-500/600`, `purple-600`, `orange-600` as button backgrounds
- `white/10`, `white/20`, `white/30` opacity borders -- use explicit zinc values

---

## 3. Typography

### 3.1 Font Stack

```
Primary:  Geist Mono  — var(--font-geist-mono) — font-mono
Fallback: Geist Sans  — var(--font-geist-sans) — font-sans
System:   -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace
```

Both fonts are loaded in `layout.tsx` via `geist/font/sans` and `geist/font/mono`.

### 3.2 Type Scale

| Element                  | Classes                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| **Hero heading**         | `text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase leading-[0.9]` |
| **Page heading**         | `text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none` |
| **Section heading**      | `text-3xl md:text-4xl font-bold tracking-tighter uppercase`         |
| **Card heading**         | `text-sm font-bold uppercase tracking-wider`                        |
| **Subtitle accent**      | `text-zinc-700` (span inside heading)                                |
| **Body**                 | `text-zinc-400 text-sm md:text-base leading-relaxed`                |
| **Small body**           | `text-zinc-500 text-xs leading-relaxed`                             |
| **Label / Metadata**     | `text-zinc-600 text-[10px] uppercase tracking-widest`               |
| **Badge text**           | `text-blue-500 text-[10px] uppercase tracking-widest`               |
| **Nav link**             | `text-[11px] uppercase tracking-widest text-zinc-500 hover:text-white` |
| **Monospace data**       | `font-mono text-sm text-zinc-300`                                   |

### 3.3 Rules

- All headings are **uppercase**.
- All labels, tags, and metadata use **`text-[10px] uppercase tracking-widest`**.
- Body text never exceeds `text-base` (16px). Prefer `text-sm` (14px).
- No `font-semibold` in headings -- always `font-bold`.
- No `text-lg`, `text-xl`, `text-2xl` for casual use. Large text is reserved for hero/page headings.

---

## 4. Layout

### 4.1 Page Wrapper

```tsx
<main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
```

### 4.2 Section Container

```tsx
<section className="border-t border-zinc-900">
  <div className="max-w-7xl mx-auto px-6 py-20">
    {/* content */}
  </div>
</section>
```

### 4.3 Hero Section

```tsx
<section className="max-w-7xl mx-auto px-6 py-32 md:py-44">
  <div className="max-w-3xl">
    <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-8">
      Badge Label
    </div>
    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase leading-[0.9]">
      Primary<br />
      <span className="text-zinc-700">Secondary</span>
    </h1>
    <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-8">
      Description text.
    </p>
  </div>
</section>
```

### 4.4 Section Dividers

All sections are separated by `border-t border-zinc-900`. Never use margin-based spacing between major sections.

### 4.5 Grid Patterns

| Pattern        | Classes                                              | Usage            |
| -------------- | ---------------------------------------------------- | ---------------- |
| Feature grid   | `grid sm:grid-cols-2 lg:grid-cols-4 gap-12`          | Feature blocks   |
| Pricing grid   | `grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900` | Pricing cards |
| Stats row      | `grid grid-cols-2 gap-8`                             | Key-value stats  |
| Card grid      | `grid sm:grid-cols-2 lg:grid-cols-3 gap-6`           | Marketplace      |

### 4.6 Max Widths

| Context        | Class          |
| -------------- | -------------- |
| Full layout    | `max-w-7xl`    |
| Content pages  | `max-w-4xl`    |
| Narrow forms   | `max-w-2xl`    |
| Chat / panels  | `max-w-3xl`    |
| Inline cards   | `max-w-md`     |

---

## 5. Components

### 5.1 Buttons

**Primary (CTA)**
```tsx
<a className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
  Deploy Fleet
</a>
```

**Secondary**
```tsx
<a className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
  Try Demo
</a>
```

**Danger (destructive)**
```tsx
<button className="inline-flex items-center justify-center border border-red-500/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors">
  Delete
</button>
```

**Rules:**
- No `border-radius` on buttons (rectangular).
- No colored backgrounds (no `bg-blue-600`, `bg-green-500`).
- Primary action is always white on black.
- All button text is `uppercase tracking-widest text-xs font-bold`.

### 5.2 Badges / Tags

```tsx
<div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest">
  Protocol Label
</div>
```

**Inline tag (blog, marketplace):**
```tsx
<span className="text-[10px] uppercase tracking-widest text-zinc-600">
  Tag Name
</span>
```

No `rounded-full` pill shapes. No colored backgrounds for tags.

### 5.3 Cards

```tsx
<div className="bg-zinc-900 border border-zinc-800 p-6">
  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
    Label
  </div>
  <h3 className="text-sm font-bold uppercase tracking-wider mb-2">
    Card Title
  </h3>
  <p className="text-zinc-500 text-xs leading-relaxed">
    Description text.
  </p>
</div>
```

No `rounded-*` classes on cards. No shadows. No gradients.

### 5.4 Form Inputs

```tsx
<input
  type="text"
  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
  placeholder="Enter value..."
/>
```

```tsx
<select className="bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 font-mono">
  <option>Option</option>
</select>
```

```tsx
<textarea
  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono resize-none"
  rows={4}
/>
```

No `rounded-lg` on inputs. No `ring-*` focus styles. Use `focus:border-zinc-600`.

### 5.5 Navigation (Global)

```tsx
<nav className="w-full flex items-center justify-between px-6 h-14 fixed top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-900 font-mono">
  <a className="flex items-center gap-2" href="/">
    <span className="text-sm font-bold tracking-tight">Agentbot</span>
  </a>
  <div className="hidden md:flex items-center gap-6">
    <a className="text-[11px] uppercase tracking-widest transition-colors text-zinc-500 hover:text-white" href="/pricing">
      Pricing
    </a>
    {/* more links */}
  </div>
</nav>
```

### 5.6 Footer

```tsx
<footer className="w-full border-t border-zinc-900 bg-black font-mono">
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="flex flex-col md:flex-row justify-between gap-8">
      <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
        &copy; 2026 Agentbot &middot; Zero Human Company
      </div>
      <div className="flex flex-wrap gap-6">
        <a className="text-zinc-600 text-[10px] uppercase tracking-widest hover:text-white transition-colors" href="/why">
          Why
        </a>
        {/* more links */}
      </div>
    </div>
  </div>
</footer>
```

### 5.7 Status Indicators

```tsx
{/* Online dot */}
<span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

{/* Status badge */}
<div className="flex items-center gap-2 px-3 py-1 border border-zinc-800">
  <span className="w-2 h-2 rounded-full bg-green-400" />
  <span className="text-[10px] uppercase tracking-widest text-zinc-400">Online</span>
</div>
```

No emoji status indicators. Use colored dots only.

### 5.8 Data Display

**Key-Value Pair:**
```tsx
<div className="space-y-2">
  <span className="text-zinc-600 text-[10px] uppercase block">Label</span>
  <span className="text-white text-sm font-bold uppercase">Value</span>
</div>
```

**Stat Card:**
```tsx
<div className="bg-zinc-900 border border-zinc-800 p-6">
  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Metric</div>
  <div className="text-3xl font-bold tracking-tighter">42</div>
  <div className="text-[10px] text-zinc-600 mt-1">+8% this month</div>
</div>
```

**Progress Bar:**
```tsx
<div className="h-1.5 bg-zinc-800 overflow-hidden">
  <div className="h-full bg-white" style={{ width: '45%' }} />
</div>
```

### 5.9 Tables

```tsx
<table className="w-full border-collapse">
  <thead>
    <tr className="border-b border-zinc-800">
      <th className="text-left p-4 text-[10px] uppercase tracking-widest text-zinc-600">Column</th>
    </tr>
  </thead>
  <tbody className="text-zinc-400 text-sm">
    <tr className="border-b border-zinc-900">
      <td className="p-4">Cell value</td>
    </tr>
  </tbody>
</table>
```

### 5.10 Lists (FAQ / Accordion)

```tsx
<div className="divide-y divide-zinc-900">
  <div className="py-6">
    <dt className="text-sm font-bold text-white uppercase tracking-wider">Question?</dt>
    <dd className="mt-2 text-xs text-zinc-500 leading-relaxed">Answer.</dd>
  </div>
</div>
```

---

## 6. Spacing System

| Token | Value  | Usage                              |
| ----- | ------ | ---------------------------------- |
| `py-32 md:py-44` | 8rem / 11rem | Hero sections              |
| `py-20`           | 5rem         | Standard sections          |
| `py-16`           | 4rem         | Compact sections           |
| `py-12`           | 3rem         | Footer                     |
| `gap-16`          | 4rem         | Between major flex items    |
| `gap-12`          | 3rem         | Feature grids               |
| `gap-8`           | 2rem         | Card grids, stat rows       |
| `gap-6`           | 1.5rem       | Between items in a list     |
| `mb-8`            | 2rem         | Heading to body gap         |
| `mb-4`            | 1rem         | Label to heading gap        |
| `px-6`            | 1.5rem       | Page horizontal padding     |
| `p-6` / `p-8`     | 1.5 / 2rem | Card inner padding         |

---

## 7. Motion

| Animation         | Class                  | Duration | Usage                   |
| ----------------- | ---------------------- | -------- | ----------------------- |
| Fade in           | `animate-fade-in`      | 500ms    | Page load               |
| Fade in up        | `animate-fade-in-up`   | 500ms    | Sections on scroll      |
| Scale in          | `animate-scale-in`     | 300ms    | Modals, popovers        |
| Pulse             | `animate-pulse`        | default  | Status dots, loading    |
| Transition colors | `transition-colors`    | 150ms    | All interactive elements|

No `animate-bounce` except for typing indicators. No `animate-spin` except for genuine loading spinners (use text "Loading..." instead).

---

## 8. Responsive Breakpoints

| Breakpoint | Tailwind | Min Width | Usage                     |
| ---------- | -------- | --------- | ------------------------- |
| Mobile     | default  | 0px       | Single column, stacked    |
| Tablet     | `sm:`    | 640px     | 2-column grids            |
| Desktop    | `md:`    | 768px     | Show nav, flex rows       |
| Wide       | `lg:`    | 1024px    | 3-4 column grids          |

Mobile-first. Default styles are mobile. Layer up with `sm:`, `md:`, `lg:`.

---

## 9. Iconography

**No emojis in UI chrome.** This includes:
- Navigation items
- Card headings
- Button labels
- Status indicators
- Loading states

Allowed emoji usage:
- Marketing content body text (sparingly)
- User-generated content
- Notification toasts (if absolutely necessary)

For status/indicators, use colored dots:
```tsx
<span className="w-2 h-2 rounded-full bg-green-400" />  // online
<span className="w-2 h-2 rounded-full bg-red-400" />     // error
<span className="w-2 h-2 rounded-full bg-yellow-400" />  // warning
<span className="w-2 h-2 rounded-full bg-zinc-600" />    // offline
```

---

## 10. Do / Don't Quick Reference

| DO                                          | DON'T                                          |
| ------------------------------------------- | ---------------------------------------------- |
| `bg-zinc-900`                               | `bg-gray-900`                                  |
| `border border-zinc-800`                    | `border border-gray-800`                       |
| `text-zinc-400`                             | `text-gray-400`                                |
| `text-[10px] uppercase tracking-widest`     | `text-xs rounded-full bg-gray-800`             |
| `font-bold tracking-tighter uppercase`      | `font-semibold`                                |
| `bg-white text-black` (primary button)      | `bg-blue-600 text-white rounded-lg`            |
| `border border-zinc-800` (secondary button) | `bg-gray-900 border border-white/10 rounded-xl`|
| `border-t border-zinc-900` (section divider)| margin-only spacing between sections           |
| Colored dot for status                      | Emoji for status                               |
| `font-mono` on page wrapper                 | Default `font-sans` on marketing pages         |
| `selection:bg-blue-500/30`                  | Default selection color                        |
| Rectangular buttons (no radius)             | `rounded-lg`, `rounded-xl`, `rounded-2xl`      |
| `hover:bg-zinc-200` (primary hover)         | `hover:bg-gray-200`                            |
| `max-w-7xl mx-auto px-6`                    | Custom arbitrary widths                        |

---

## 11. File References

| File                     | Purpose                           |
| ------------------------ | --------------------------------- |
| `app/globals.css`        | CSS variables, animations, resets |
| `tailwind.config.js`     | Font families, extended colors    |
| `app/layout.tsx`         | Geist font loading, global meta   |
| `app/components/Navbar.tsx`  | Global navigation              |
| `app/components/Footer.tsx`  | Global footer                  |
| `appsrc/components/page.tsx` | Gold standard reference page      |
| `app/page.tsx`           | Homepage — reference layout       |
| `app/pricing/page.tsx`   | Pricing grid reference            |

---

## 12. Linting (Recommended)

Add to ESLint or a custom script to catch regressions:

```
Forbidden patterns in .tsx files:
- /bg-gray-/         → use bg-zinc-*
- /text-gray-/       → use text-zinc-*
- /border-gray-/     → use border-zinc-*
- /rounded-2xl/      → remove or use no rounding
- /rounded-xl/       → remove or use no rounding
- /bg-gradient-to-/  → no gradients
- /font-semibold/    → use font-bold
- /bg-blue-600/      → use bg-white text-black for primary
- /bg-green-5/       → no green button backgrounds
- /bg-purple-/       → no purple backgrounds
- /bg-orange-/       → no orange backgrounds
```

---

*This document is the single source of truth for all Agentbot UI. Every new page, component, or feature must conform to these specifications. When in doubt, reference `src/components`.*
