# Kold brand — UI application

Source: Kold brand identity system (brand guide image). This file is the
software translation; where the guide and accessibility conflict, this
file wins.

## Palette & roles

| Token         | Hex       | Role in UI                                        |
|---------------|-----------|---------------------------------------------------|
| `brand.deep`  | `#0F2D4D` | Body text, labels, table text, nav                |
| `brand`       | `#409BD8` | Headings, primary buttons, links, accents, logo   |
| `brand.ice`   | `#E6F2FA` | Tint panels, info backgrounds, hovers             |
| `brand.mist`  | `#F2F4F7` | Page background                                   |
| `brand.slate` | `#6B7B84` | Secondary text, borders, icons                    |

**Rule: Kold Blue `#409BD8` is never body-text color** — ~3.0:1 on white,
fails WCAG AA. Deep Blue carries all reading text (13.9:1). Headings and
primary buttons moved to Kold Blue by owner decision (2026-07-08) — they
are large/bold enough for the 3:1 large-text threshold; body copy stays
Deep Blue.

## Semantic extension (not in the brand guide — required for status UI)

| Token     | Solid     | Soft bg   | Used for                          |
|-----------|-----------|-----------|-----------------------------------|
| `success` | `#2E8B6E` | `#E4F3EE` | Saved, paid, healthy stock        |
| `warning` | `#B87A1E` | `#FBF1DE` | Expiring soon, low stock, AR due  |
| `danger`  | `#C24040` | `#FBEAEA` | Expired, overdue, write-off       |

## Wordmark casing

The brand name is always all-lowercase in user-facing text: **kold**,
**kold ms**, **kold brew hub** — never "Kold" (owner decision 2026-07-08).
Code identifiers and prose in internal docs are exempt.

## Typography & shape

- Font: **Nunito** via `next/font` (weights 300/400/600/700), fallback
  system sans. UI text weights: 400 body, 600 emphasis.
- Radius: 10px default, 14px cards — echoes the logotype's roundness.
- Brand voice for customer-facing copy: clear, confident, calm.
  Tagline where appropriate: "Stay cool. Live Kold."

## Volume by surface

- **B2C form & B2B portal:** full brand — logo, tagline, wave pattern,
  Ice Blue generously.
- **Internal ops tool:** quiet brand — Nunito + palette + small `k.`
  mark; no tagline, no pattern. Operators stare at it for hours.
- **Official documents (delivery notes, invoices — D18):** issued as
  "kold brew hub" (registered name, JR0189682-H); Nunito; brand blue
  `#409BD8` for accents, dark body text for print legibility. One shared
  business-identity config (legal name, reg no., bank ref) feeds every
  generated document.

## Tailwind mapping

```ts
colors: {
  brand: { DEFAULT: "#409BD8", deep: "#0F2D4D", ice: "#E6F2FA",
           mist: "#F2F4F7", slate: "#6B7B84" },
  success: { DEFAULT: "#2E8B6E", soft: "#E4F3EE" },
  warning: { DEFAULT: "#B87A1E", soft: "#FBF1DE" },
  danger:  { DEFAULT: "#C24040", soft: "#FBEAEA" },
},
fontFamily: { sans: ["var(--font-nunito)", ...defaultTheme.fontFamily.sans] },
borderRadius: { DEFAULT: "10px", lg: "14px" },
```

Map shadcn/ui CSS variables (`--primary`, `--muted`, etc.) onto these so
components inherit the brand without per-component styling.
