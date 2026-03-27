# Agentbot Brand Guidelines

The source of truth for Agentbot's visual identity. Every page, component, and surface must follow these rules.

---

## 1. Design Philosophy

**Vercel/Geist-inspired dark minimalism.** Brutalist typography. No gradients. No crypto aesthetics. Black, white, monospace. The design says "infrastructure" — not "token launch."

**Core Principles:**
- Dark only — no light mode, ever
- Monospace for everything
- Uppercase + tight tracking for emphasis
- Borders over shadows
- Data over decoration

---

## 2. Typography

### Font Stack
```
font-mono  (primary — all UI text, headings, labels)
font-sans  (Geist Sans — body text only in content-heavy pages like /why, /learn, /docs)
```

### Heading Hierarchy
```tsx
// Hero
<h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase leading-[0.9]">

// Section titles
<h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">

// Subsection
<h3 className="text-xl font-bold tracking-tighter uppercase">

// Labels & tags
<span className="text-[10px] uppercase tracking-widest text-zinc-500">
```

### Body Text
```tsx
// Primary body
<p className="text-zinc-400 text-sm leading-relaxed">

// Secondary / muted
<p className="text-zinc-500 text-xs leading-relaxed">

// Label text
<span className="text-[10px] uppercase tracking-widest text-zinc-600">
```

### Rules
- **Headings**: Always `uppercase tracking-tighter font-bold`
- **Labels**: Always `text-[10px] uppercase tracking-widest`
- **Body**: Always `text-sm` or `text-xs`, never larger
- **No italic, no decorative fonts**

---

## 3. Colors

### Backgrounds
| Token | Value | Usage |
|---|---|---|
| `bg-black` | `#000000` | Page background, card backgrounds |
| `bg-zinc-950` | `#09090b` | Alternate card backgrounds |
| `bg-zinc-900` | `#18181b` | Grid separator lines (gap-px) |
| `bg-zinc-800` | `#27272a` | Subtle borders, secondary surfaces |

### Text
| Token | Value | Usage |
|---|---|---|
| `text-white` | `#fafafa` | Headings, primary text |
| `text-zinc-400` | `#a1a1aa` | Body text |
| `text-zinc-500` | `#71717a` | Secondary text, list items |
| `text-zinc-600` | `#52525b` | Labels, tertiary text |
| `text-zinc-700` | `#3f3f46` | De-emphasized heading accents |

### Accents
| Token | Value | Usage |
|---|---|---|
| `text-blue-500` | `#EF6F2E` | Section labels, active states, links |
| `border-blue-500/30` | `rgba(239,111,46,0.3)` | Active badges |
| `bg-blue-500/30` | `rgba(239,111,46,0.3)` | Selection highlight |
| `bg-white` | `#fafafa` | Primary CTA buttons |

### Status
| Token | Value | Usage |
|---|---|---|
| `text-green-500` | `#22c55e` | Success, check marks |
| `text-red-500` | `#ef4444` | Errors, destructive |
| `text-yellow-500` | `#eab308` | Warnings |
| `text-orange-500` | `#f97316` | Caution |

### Rules
- **No gradients** — flat colors only
- **No transparency overlays** on backgrounds
- **Orange (`#EF6F2E`)** is the primary accent — mapped to Tailwind `blue-500` via config override
- Borders always `border-zinc-800` (interactive) or `border-zinc-900` (structural dividers)

---

## 4. Layout

### Page Structure
```tsx
<main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
  {/* Hero section — no border-top */}
  <section className="max-w-7xl mx-auto px-6 py-32 md:py-44">
    ...
  </section>

  {/* All subsequent sections have border-t */}
  <section className="border-t border-zinc-900">
    <div className="max-w-7xl mx-auto px-6 py-16">
      ...
    </div>
  </section>
</main>
```

### Container
- `max-w-7xl mx-auto px-6` — always
- `py-16` for content sections, `py-20` for larger sections, `py-32 md:py-44` for hero

### Section Dividers
```tsx
// Structural section border (always border-zinc-900)
<section className="border-t border-zinc-900">

// Inline separator (e.g., FAQ items)
<Separator className="bg-zinc-900" />
// or
<div className="divide-y divide-zinc-900">
```

### Grid — Vercel Style (Cards)
```tsx
// Borderless touching cards
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
  {items.map((item) => (
    <div key={item.id} className="bg-black p-8">
      {item.content}
    </div>
  ))}
</div>
```

### Two-Column Layout
```tsx
<section className="border-t border-zinc-900">
  <div className="max-w-7xl mx-auto px-6 py-20">
    <div className="flex flex-col md:flex-row gap-16 items-start">
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Label</div>
        <h2 className="text-2xl font-bold tracking-tighter uppercase">Title</h2>
      </div>
      <div className="flex-1">
        Content
      </div>
    </div>
  </div>
</section>
```

### Rules
- **Always** `max-w-7xl` for content width
- **Always** `px-6` horizontal padding
- **Always** `border-zinc-900` for section dividers
- **Never** centered text blocks — always left-aligned
- **Never** box shadows — use borders only

---

## 5. Components

### Buttons

**Primary (CTA):**
```tsx
<Link
  href="/signup"
  className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
>
  Deploy Fleet
</Link>
```

**Secondary:**
```tsx
<Link
  href="/demo"
  className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
>
  Try Demo
</Link>
```

**Using shadcn/ui Button (for new code):**
```tsx
<Button
  className="bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest"
  onClick={() => window.location.href = '/signup'}
>
  Deploy Fleet
</Button>

<Button
  variant="outline"
  className="border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-bold uppercase tracking-widest"
>
  Try Demo
</Button>
```

### Buttons — Rules
- **Always** `text-xs font-bold uppercase tracking-widest`
- **Always** `px-6 py-3`
- Primary = `bg-white text-black`
- Secondary = `border border-zinc-800 text-zinc-400`
- **No** rounded corners (default button `rounded-lg` is acceptable but avoid `rounded-full`)
- **No** icon-only buttons unless in a toolbar

### Badges / Labels

```tsx
// Section label
<Badge variant="outline" className="border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest">
  Platform Operator Protocol
</Badge>

// Feature category
<Badge variant="secondary" className="text-[10px] uppercase tracking-widest">
  Agentbot
</Badge>

// Status badge
<Badge variant="outline" className="text-[9px] uppercase tracking-widest text-blue-500 border-blue-500/30">
  Popular
</Badge>

// Payment method pill
<Badge variant="outline" className="border-zinc-900 text-zinc-500 text-[10px] uppercase tracking-widest">
  Visa
</Badge>
```

### Badges — Rules
- **Always** `text-[10px] uppercase tracking-widest` (or `text-[9px]` for tight spaces)
- Section labels: `border-zinc-800 text-blue-500`
- Categories: `variant="secondary"`
- Pills/chips: `border-zinc-900 text-zinc-500`

### Cards

**Standard card (Vercel grid):**
```tsx
<div className="bg-black p-8 flex flex-col">
  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-6">Label</div>
  <div className="text-3xl font-bold tracking-tighter mb-6">£29<span className="text-sm font-normal text-zinc-600">/mo</span></div>
  <ul className="space-y-2 text-xs text-zinc-500 mb-8 flex-1">
    <li className="flex items-start gap-2">
      <Check className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
      Feature
    </li>
  </ul>
</div>
```

**Standalone card (with border):**
```tsx
<div className="border border-zinc-800 rounded-xl p-6">
  Content
</div>
```

### Feature Lists
```tsx
<ul className="space-y-2 text-xs text-zinc-500">
  <li className="flex items-start gap-2">
    <Check className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
    Feature description
  </li>
</ul>
```

### FAQ / Accordion
```tsx
<div className="space-y-0">
  {faqs.map((faq, i) => (
    <div key={i}>
      {i > 0 && <Separator className="bg-zinc-900" />}
      <div className="py-6">
        <dt className="text-sm font-bold uppercase tracking-wider">{faq.q}</dt>
        <dd className="mt-2 text-xs text-zinc-500 leading-relaxed">{faq.a}</dd>
      </div>
    </div>
  ))}
</div>
```

---

## 6. Navigation

### Navbar
```tsx
<nav className="w-full flex items-center justify-between px-6 h-14 fixed top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-900 font-mono">
```

### Nav Links
```tsx
<span className={`text-xs font-medium tracking-wide transition-colors ${
  isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
}`}>
  Link Text
</span>
```

---

## 7. Forms & Inputs

```tsx
<input
  type="text"
  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
  placeholder="Enter API key..."
/>
```

### Rules
- **Always** `bg-zinc-900 border-zinc-800` for input backgrounds
- **Always** `font-mono`
- **Always** `placeholder:text-zinc-600`
- Focus: `focus:border-zinc-600` (never blue glow)

---

## 8. Tables

```tsx
<table className="w-full text-xs">
  <thead>
    <tr className="border-b border-zinc-900 text-left text-[10px] uppercase tracking-widest text-zinc-500">
      <th className="py-3 pr-4">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-zinc-900/50">
      <td className="py-3 pr-4 text-zinc-400">Data</td>
    </tr>
  </tbody>
</table>
```

---

## 9. Brand Voice

### Terminology
| Use | Don't Use |
|---|---|
| Deploy Fleet | Sign Up |
| Mission Control | Dashboard |
| Platform Operator | User |
| BYOK (Bring Your Own Key) | "Connect your API" |
| Underground / Collective / Label / Network | Pro / Enterprise / Starter |
| Crew | Team |
| Skills | Plugins / Extensions |
| Marketplace | App Store |
| Mission Control | Admin Panel |

### Tone
- **Direct**, not corporate
- **Technical**, not marketing-speak
- **Military/naval** metaphors (fleet, crew, operator, deploy)
- **Lowercase** body text, **uppercase** headings — always
- **No emoji** in copy (use sparingly in UI feedback)
- **No exclamation marks** in headings

### Voice Examples
```
✅ "Deploy Fleet"
✅ "Your autonomous crew handles bookings"
✅ "Platform Operator Protocol"
❌ "Welcome aboard!"
❌ "Start your journey"
❌ "Unlock the power of AI"
```

---

## 10. shadcn/ui Integration

shadcn/ui components are available at `@/components/ui/`. When using them:

### DO
- Use `Badge` for labels, pills, status indicators
- Use `Button` for all CTAs (with the class overrides above)
- Use `Separator` for section dividers
- Use `Card` only for standalone cards (not in Vercel grids)
- Use `Input` for form fields
- Use `Check` from lucide-react for feature lists

### DON'T
- Don't use `Card` in the Vercel `gap-px bg-zinc-900` grid pattern
- Don't rely on shadcn default colors — always override with Agentbot classes
- Don't use `font-sans` for anything in shadcn components (base styles already have `font-mono`)
- Don't introduce new colors from the shadcn palette

### Overriding shadcn/ui Defaults
The base component styles in `components/ui/*.tsx` already include `font-mono` on Button and Badge. If a new component doesn't match, add `font-mono` to its base CVA definition — don't rely on page-level overrides.

---

## 11. Icons

**Library**: Lucide React (`lucide-react`)
**Size**: `h-3.5 w-3.5` (inline), `h-4 w-4` (default), `h-5 w-5` (large)
**Color**: Inherit from parent, or `text-zinc-600` for decorative

```tsx
import { Check, ArrowRight, ExternalLink } from 'lucide-react'
<Check className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
```

---

## 12. Responsive

### Breakpoints (Tailwind defaults)
- `sm:` — 640px
- `md:` — 768px
- `lg:` — 1024px
- `xl:` — 1280px

### Mobile Rules
- Hero: `text-5xl md:text-7xl lg:text-8xl`
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Padding: `px-6` everywhere
- Stack: `flex-col md:flex-row` for two-column layouts
- Gap: `gap-12` for content columns, `gap-16` for major sections

---

## 13. Animations

Minimal. Functional only.

```tsx
// Transitions (on hover/focus only)
transition-colors  // buttons, links
transition-all     // cards (sparingly)

// Loading
animate-pulse      // skeleton loaders
```

### Rules
- **No** bounce, spin, or entrance animations
- **No** page transitions
- **No** parallax or scroll effects
- Pulse is acceptable for loading states only

---

## 14. OG Images & Favicons

- **OG Image**: `/og-image.png` (1200×630, black bg, white text, Agentbot logo)
- **Favicon**: `/favicon.ico` (round, same as navbar logo)
- **Logo**: `/image0.jpeg` (circular, used in navbar)

---

_Last updated: 2026-03-21_
_This document is the source of truth. When in doubt, refer to the home page (`/`) and pricing page (`/pricing`) as canonical examples._
