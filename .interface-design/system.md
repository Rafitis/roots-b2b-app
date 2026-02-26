# Roots Barefoot B2B — Design System

## Direction & Feel

**Identity:** The "workshop behind the storefront." Same brand DNA as rootsbarefoot.com, but optimized for professional work — denser, more structured, tool-like. Where the retail site is editorial and aspirational, the B2B app is warm and functional.

**Differentiation from retail:**
- Retail = spacious, photographic, consumer-facing editorial
- B2B = compact, data-dense, professional warmth

**Temperature:** Warm earth tones — sand, stone, bark, clay. Never cold grays.

## DaisyUI Theme: `roots-b2b`

Custom theme in `tailwind.config.js`. Uses warm earth palette instead of generic cupcake.

## Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `roots-sand` | `#f5f0eb` | Page background, base-200 |
| `roots-stone` | `#e8e2db` | Borders, base-300 |
| `roots-bark` | `#3d3428` | Primary text, primary buttons |
| `roots-earth` | `#5c4f3d` | Secondary text, labels |
| `roots-clay` | `#8b7355` | Tertiary text, muted elements |
| `roots-moss` | `#6b7c5e` | Success, positive states |
| `roots-warm-white` | `#faf7f4` | Card surfaces, base-100 |

### CSS Custom Properties (Layout.astro)
```
--roots-sand, --roots-stone, --roots-bark, --roots-earth,
--roots-clay, --roots-moss, --roots-warm-white,
--roots-border, --roots-border-strong
```

## Typography

**Font:** Figtree Variable (via `@fontsource-variable/figtree`)
**Fallback:** system-ui, sans-serif
**Anti-aliasing:** enabled globally

## Depth Strategy: Borders

- **Primary approach:** Subtle borders (`border-base-300/50`, `border-base-300/60`)
- **Card shadow:** `shadow-soft` — barely visible, just enough lift
- **Elevated:** `shadow-lifted` — for sticky elements, bulk action bars
- **No dramatic shadows** — borders do the structural work

## Spacing

- **Base unit:** Tailwind default (4px increments)
- **Header height:** 80px default, 64px scrolled
- **Content offset:** `pt-24` (96px)
- **Section gap:** `space-y-16` between product groups
- **Card padding:** `p-4` to `p-5`
- **Max content width:** `max-w-7xl` for most pages, `max-w-5xl` for cart

## Component Patterns

### `.card-b2b`
```css
@apply bg-base-100 border border-base-300/50 rounded-lg;
box-shadow: 0 1px 3px rgba(61, 52, 40, 0.06), 0 1px 2px rgba(61, 52, 40, 0.04);
```

### `.section-heading`
```css
@apply text-lg font-semibold text-roots-bark tracking-tight pb-3 border-b border-base-300/60;
```

### `.input-b2b`
```css
@apply input bg-base-100 border-base-300 focus:border-roots-clay focus:outline-none transition-colors;
```

### Tables
- Sticky header with `bg-base-200/60`
- `divide-y divide-base-300/40` for row separation
- `hover:bg-base-200/30` for row hover
- `tabular-nums` on all numeric columns

### Buttons
- Primary: `btn btn-primary` (bark background, warm-white text)
- Ghost actions: `p-1.5 rounded text-roots-clay hover:text-roots-bark hover:bg-base-200`
- Destructive: `text-roots-clay hover:text-error hover:bg-error/10`

### Status Badges
- Success: `bg-success/10 text-success`
- Warning: `bg-warning/10 text-warning`
- Error: `bg-error/10 text-error`
- Info: `bg-info/10 text-info`

## Scrollbar
Custom styled — 6px width, transparent track, `rgba(61, 52, 40, 0.15)` thumb.

## Focus
`outline: 2px solid #8b7355; outline-offset: 2px;` on `:focus-visible`.
