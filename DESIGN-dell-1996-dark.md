---
version: alpha
name: Dell 1996 Analysis (Antique Gold · Dark Edition)
description: An inspired interpretation of Dell.com's 1996 design language reimagined as a dark theme with an Antique Gold (#c9a227) primary palette — a catalog-era enterprise web design built around a literal black page frame, deep flat color-block "ribbon cards" tinted in warm heritage tones on a warm near-black canvas, chunky Helvetica-Black display titles, Times Roman body copy, and an entire visual vocabulary of pre-Photoshop hand-cut GIF stickers (NEW! bursts, award seals, beveled product photos).

colors:
  primary: "#c9a227"
  primary-hover: "#dbb434"
  on-primary: "#0a0906"
  canvas: "#121210"
  surface: "#1a1917"
  surface-elevated: "#22211e"
  ink: "#f0ede6"
  muted: "#969186"
  frame-ink: "#0a0a09"
  hairline: "#2e2c28"
  border-strong: "#3d3a34"
  yellow-sticker: "#e8cf7a"
  on-sticker: "#0a0906"
  purple-stripe: "#3b2366"
  link: "#7dc4e4"

  # Utility & semantic tints (kept for semantic status, badges, and utility indicators)
  tint-olive: "#2b2922"
  tint-sage: "#2d4a3a"
  tint-salmon: "#522320"
  tint-peach: "#4d331b"
  tint-lime: "#224028"
  tint-sky: "#1e3545"
  tint-steel: "#252420"
  tint-periwinkle: "#2d3154"

typography:
  display:
    fontFamily: Arial Black
    fontSize: 36px
    fontWeight: 900
    lineHeight: 1.0
    letterSpacing: 0
  heading-1:
    fontFamily: Arial Black
    fontSize: 24px
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: 0
  heading-2:
    fontFamily: Helvetica
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  heading-3:
    fontFamily: Helvetica
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  body:
    fontFamily: Times New Roman
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-sm:
    fontFamily: Times New Roman
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  caption:
    fontFamily: Times New Roman
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0
  button:
    fontFamily: Helvetica
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 0
  link:
    fontFamily: Times New Roman
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  ui-label:
    fontFamily: Helvetica
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 0

rounded:
  none: 0px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  s: 6px
  sm: 8px
  m: 10px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  section-sm: 32px
  section: 40px
  section-lg: 48px

components:
  # ─── Brand-native components ───
  page-frame:
    backgroundColor: "{colors.frame-ink}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.none}"
    padding: 8px

  top-banner:
    backgroundColor: "{colors.frame-ink}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-2}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  section-eyebrow-olive:
    backgroundColor: "{colors.tint-olive}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: 24px 16px

  section-eyebrow-salmon:
    backgroundColor: "{colors.tint-salmon}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: 24px 16px

  ribbon-card-title:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.heading-3}"
    rounded: "{rounded.none}"
    padding: 6px 12px

  ribbon-card-body-sage:
    backgroundColor: "{colors.tint-sage}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  ribbon-card-body-salmon:
    backgroundColor: "{colors.tint-salmon}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  ribbon-card-body-peach:
    backgroundColor: "{colors.tint-peach}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  ribbon-card-body-lime:
    backgroundColor: "{colors.tint-lime}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  ribbon-card-body-sky:
    backgroundColor: "{colors.tint-sky}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  ribbon-card-body-steel:
    backgroundColor: "{colors.tint-steel}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  ribbon-card-body-periwinkle:
    backgroundColor: "{colors.tint-periwinkle}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 16px

  cta-block-gold:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    borderColor: "{colors.frame-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 16px

  phone-callout:
    backgroundColor: "{colors.frame-ink}"
    textColor: "{colors.primary}"
    typography: "{typography.heading-2}"
    rounded: "{rounded.none}"
    padding: 4px 8px

  buy-a-dell-sticker:
    backgroundColor: "{colors.yellow-sticker}"
    textColor: "{colors.on-sticker}"
    borderColor: "{colors.frame-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 4px 8px

  new-burst-sticker:
    backgroundColor: "{colors.yellow-sticker}"
    textColor: "{colors.on-sticker}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 4px 8px

  cert-seal:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    size: 64px

  icon-label-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.none}"
    padding: 8px

  text-input:
    backgroundColor: "{colors.frame-ink}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 4px 6px

  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.frame-ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 6px 16px

  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 6px 16px

  button-text-link:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.link}"
    typography: "{typography.link}"
    rounded: "{rounded.none}"

  footer-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-sm}"
    padding: 16px

  # ─── Examples (illustrative, kit-mirror) — injected by derive-examples-block.mjs ───

  # ─── Examples (illustrative) — auto-derived; resolve any TO_FILL markers below ───
  ex-pricing-tier:
    description: "Default Pricing tier card. Re-uses feature-card chrome with the base dark surface."
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  ex-pricing-tier-featured:
    description: "Featured/highlighted tier — polarity-flipped surface (in this dark theme: light fill + dark text, so it stands out against the dark canvas)."
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  ex-product-selector:
    description: "What's Included summary card — re-purposed for SaaS / B2B verticals (NOT a literal product gallery)."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  ex-cart-drawer:
    description: "Subscription summary — re-purposed for SaaS / B2B (line items per add-on, not literal cart)."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
    item-divider: "{colors.hairline}"
  ex-app-shell-row:
    description: "Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator."
    backgroundColor: "{colors.canvas}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm} {spacing.md}"
  ex-data-table-cell:
    description: "Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm."
    headerBackground: "{colors.surface}"
    headerTypography: "{typography.caption}"
    bodyTypography: "{typography.body-sm}"
    cellPadding: "{spacing.s} {spacing.md}"
    rowBorder: "{colors.hairline}"
  ex-auth-form-card:
    description: "Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  ex-modal-card:
    description: "Modal dialog surface — same chrome as feature-card with elevated shadow."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  ex-empty-state-card:
    description: "Empty-state illustration frame."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.xl}"
    captionTypography: "{typography.body}"
  ex-toast:
    description: "Toast notification surface — feature-card shape + medium shadow."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.md} {spacing.lg}"
    typography: "{typography.body-sm}"

---


## Overview

Dell's December 1996 home page is a perfectly preserved fossil of catalog-era enterprise web design — the moment when a Fortune-100 brand decided the web was *important enough* to invest in, but two years before CSS would be widely adopted and three years before "design system" was a phrase anyone used. Every visual choice on the page is a downstream consequence of that constraint: layout via HTML tables, type via the browser's built-in font stack (Arial Black / Helvetica / Times Roman), color via 8-bit-safe flat fills, and decoration via hand-cut GIF "stickers" (the NEW! burst, the round PC Magazine Readers' Choice seal, the beveled "BUY a DELL" tab). The page is bordered — literally bordered, in a 1-cell-wide black HTML table — and inside that frame, every product line gets a "ribbon card": a dark title bar with a sharp hairline underline, a deeply tinted body block in one of eight catalog colors (sage, salmon, peach, lime, sky, steel, periwinkle, olive), and a beveled product photograph notched into the right edge of the card.

In this **Antique Gold (`#c9a227`) dark-theme** adaptation, the page is a warm near-black canvas (`{colors.canvas}`) with light parchment ink (`{colors.ink}`), and the brand voice carries through in two authoritative anchors: a rich Antique Gold CTA panel on the left of the homepage (crisp black Times Roman copy on a `{colors.primary}` fill, set inside the black frame) and a gleaming gold phone number — `1-800-213-DELL` — pinned to the top-right of every page against the pure black banner. The footer is a row of four hand-drawn icon-labels (FIND / HOME / ONLINE STORE / SERVICE & SUPPORT) linked by a thin green horizontal rule, and a single underlined "Copyright" link in a lightened Mosaic blue sitting above the legal small print in Times Roman.

**Key Characteristics:**
- Literal page frame: every page sits inside a `{colors.frame-ink}` (black) outer border ~8 px thick, with a 1 px `{colors.hairline}` inner edge so it stays visible against the dark canvas — the design treats the browser window as a printed picture frame
- Flat color-block "ribbon cards" tint each product family with a dedicated catalog color (`{colors.tint-sage}` Latitude, `{colors.tint-salmon}` OptiPlex GX, `{colors.tint-periwinkle}` PowerEdge, `{colors.tint-sky}` Dellware, etc.) — no gradients, no shadows, no opacity
- Chunky display typography in `{typography.display}` (Arial Black 36 / weight 900) for section title blocks; `{typography.heading-2}` (Helvetica Bold 16) for product row titles; `{typography.body}` Times Roman 14 for everything else
- Hand-cut GIF "stickers" overlay the layout: pale-gold "BUY a DELL" tab in the top right, angled "NEW!" bursts on new product rows, round Antique Gold PC Magazine Readers' Choice seals
- `{colors.primary}` (Antique Gold) reserved for two primary attention anchors: the homepage CTA panel and the top-right phone number (plus the award seal ring) — never used as a regular product card fill
- Footer icon-nav with underlined anchors in `{colors.link}` (#7aa2ff) — the Netscape 3.x classic blue (#0000ee), lightened so it holds contrast on a dark canvas

## Colors

### Brand & Accent
- **Antique Gold** (`{colors.primary}` — #c9a227): The brand's signature primary color. Reserved for the homepage CTA panel ("At Dell.com, we'll help you find the right system…"), the top-right phone number against the black banner, and the PC Magazine Readers' Choice seal ring. Because `#c9a227` has a warm mid-high luminance, it pairs with pure black text (`{colors.on-primary}` — #000000) for razor-sharp ~8.7:1 print-catalog contrast, and reads at ~7.7:1 as text or accent against `{colors.canvas}`. Never used as a standard card body fill.
- **Sticker Pale Gold** (`{colors.yellow-sticker}` — #f7e695): Light parchment/butter-gold sticker fill — used for the "BUY a DELL" tab in the top banner and the angled "NEW!" bursts overlapping new product rows. Lightened from pure yellow so it remains distinct from the richer `{colors.primary}` Antique Gold. Stickers stay bright on the dark page and always carry black ink (`{colors.on-sticker}`).
- **Imperial Purple** (`{colors.purple-stripe}` — #2c1a4d): Deep royal purple accent stripe behind the lowercase ".com" / "DELL" wordmark text — appears inside the "BUY a DELL" sticker chrome only, providing a classic complementary contrast to the gold palette.

### Surface
- **Frame Ink** (`{colors.frame-ink}` — #000000): Pure black. The page frame, the top banner background, text-input fill, and the ink on gold/sticker surfaces. Also serves as the high-contrast backdrop for `{colors.primary}` gold callouts.
- **Canvas** (`{colors.canvas}` — #15130f): Warm near-black inside the frame. The page surface, the icon-label nav backdrop, and the footer band.
- **Surface** (`{colors.surface}` — #221f19): One step lighter than the canvas. The ribbon-card title bars, secondary buttons, and card-like example surfaces.
- **Hairline** (`{colors.hairline}` — #5a5230): Muted dark-gold rule color that replaces the black 1 px borders of the light theme (black lines vanish on a dark canvas). Used for ribbon-card edges, the title-bar underline, table dividers, the inner edge of the page frame, and input borders. A structural neutral, not an accent.

### Text
- **Ink** (`{colors.ink}` — #f4efe0): Warm parchment white for body text and headings on the dark canvas, the surface and the ribbon-card tints (7:1 or better on all of them). Text placed *on* `{colors.primary}` or sticker fills stays pure black (`{colors.on-primary}` / `{colors.on-sticker}`).
- **On-Sticker** (`{colors.on-sticker}` — #000000): Black ink for the pale-gold sticker fills.
- **Link** (`{colors.link}` — #7aa2ff): Lightened Mosaic / Netscape 3.x link blue (the original #0000ee is unreadable on dark). Underlined inline anchors ("Copyright", "(Terms of Use)", inline "from Dell's award-winning service and support teams").

### Ribbon-Card Tint Family
Eight catalog colors, one per product line — in the dark theme each is deepened into a muted, earthy tone that sits alongside `{colors.primary}` Antique Gold while keeping its hue identity. Light `{colors.ink}` text on every tint is 7:1 or better:
- **Olive** (`{colors.tint-olive}` — #4a4820): "DIMENSION DESKTOPS" eyebrow block (a dark earthy green-olive that stays distinct from `#c9a227` Antique Gold)
- **Sage** (`{colors.tint-sage}` — #3f4836): Latitude Notebooks ribbon body
- **Salmon** (`{colors.tint-salmon}` — #6e3b36): "OPTIPLEX DESKTOP SYSTEMS" eyebrow + GX Series body
- **Peach** (`{colors.tint-peach}` — #704624): Dimension card body + OptiPlex Gs body
- **Lime** (`{colors.tint-lime}` — #46512f): OptiPlex G Series body
- **Sky** (`{colors.tint-sky}` — #2f4756): Dellware ribbon body
- **Steel** (`{colors.tint-steel}` — #3a444a): Dimension XPS Pro ribbon body
- **Periwinkle** (`{colors.tint-periwinkle}` — #3b4278): PowerEdge ribbon body

The tints are deep and low-key rather than vivid — still flat fills with no gradients, so the catalog character survives while the page stays dark and gold remains the brightest chromatic element.

## Typography

### Font Family

Three system-stack families, no webfonts (webfonts didn't exist yet):

- **Arial Black** (fallback: Helvetica, system-ui sans) — display headings only. The chunky stenciled section eyebrows ("DIMENSION DESKTOPS", "OPTIPLEX DESKTOP SYSTEMS") are Arial Black at weight 900, set in all-caps with normal tracking.
- **Helvetica** (fallback: Arial, system-ui sans) — product-row titles, button labels, the top banner's "BUILD YOUR OWN COMPUTER. ONLINE." headline. Always bold (700), always all-caps.
- **Times New Roman** (fallback: Times, serif) — body copy. Every paragraph, every caption, every inline anchor sits in default-rendered Times Roman. The serifs date the design instantly — body text on the modern web is almost never serif.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display}` | 36px | 900 | 1.0 | Section eyebrow titles ("DIMENSION DESKTOPS", "OPTIPLEX DESKTOP SYSTEMS") |
| `{typography.heading-1}` | 24px | 900 | 1.05 | Sub-page hero headlines |
| `{typography.heading-2}` | 16px | 700 | 1.2 | Top banner copy, product-line H1 ("Reliable PC's for High-Performance Computing.") |
| `{typography.heading-3}` | 14px | 700 | 1.2 | Ribbon-card title bar ("OPTIPLEX GX PRO", "DIMENSION XPS") |
| `{typography.body}` | 14px | 400 | 1.4 | Default paragraph copy, ribbon-card body, CTA-panel copy |
| `{typography.body-sm}` | 12px | 400 | 1.4 | "This site is best viewed with browser versions 3.0 and higher." |
| `{typography.caption}` | 11px | 400 | 1.35 | Footer copyright text |
| `{typography.button}` | 12px | 700 | 1.0 | Button labels, "NEW!" sticker, BUY-a-DELL sticker |
| `{typography.ui-label}` | 12px | 700 | 1.0 | Icon-label nav uppercase labels ("FIND", "HOME", "ONLINE STORE", "SERVICE & SUPPORT") |

### Principles
- Sans for UI, serif for body — the inverse of the modern convention, and a dead giveaway of mid-90s typography.
- Display weights are extreme (900 / Black) and never softer. The "Dimension" / "OptiPlex" eyebrow blocks lean on the heaviest weight the font ships.
- No letter-spacing tracking adjustments — pixel-fonts in 1996 didn't reward it. Everything is set at the browser's default kern.
- Line-height is tight on display (1.0) and conventional on body (1.4) — a holdover from print-magazine catalog layout.

### Note on Font Substitutes
All three families are operating-system defaults on every consumer OS shipped in 1996 (Windows 95: Arial / Times New Roman; Mac OS 7.5+: Helvetica / Times). The brand had no fallback strategy because no fallback was needed — the fonts were always present. Modern reproductions can stay on this exact stack (Arial Black / Helvetica / Times New Roman) for authenticity.

## Layout

### Spacing System

- **Base unit**: 4 px (with 2 / 6 / 10 intermediates). 1996 page layout was driven by HTML table cell padding (`cellpadding="4"` / `cellspacing="0"`) rather than a designed scale.
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.s}` 6px · `{spacing.sm}` 8px · `{spacing.m}` 10px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 20px · `{spacing.xxl}` 24px · `{spacing.section-sm}` 32px · `{spacing.section}` 40px · `{spacing.section-lg}` 48px.
- **Card interior padding**: `{spacing.md}` 12 px vertical / `{spacing.lg}` 16 px horizontal on ribbon-card bodies.
- **Section vertical rhythm**: `{spacing.section}` 40 px between product-ribbon stacks; `{spacing.section-sm}` 32 px between the eyebrow color block and its first ribbon-card.

### Grid & Container
- Fixed-width table layout pinned around 760 px wide — the de facto 1996 standard targeting 800×600 monitors with a small scrollbar gutter.
- Two-column outer structure: left rail (~28 %) carries the homepage icon-link grid + CTA Antique Gold panel; right column (~72 %) carries the product ribbon stack.
- No grid system in the modern sense — every section is its own `<table>` declaration with hard-coded column widths.

### Whitespace Philosophy
Tight by modern standards. Catalog density wins over editorial breath — every pixel inside the black frame is doing work (illustration, color block, headline, body). The compensating decompression happens *inside* each ribbon card: dark title bar + tinted body block + product photo notch creates internal breathing room without enlarging the overall page.

### Responsive Strategy

#### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Period default | 800 × 600 | Fixed 760 px layout, designed for the era's standard monitor |
| Modern desktop | 1280+ px | Layout sits centered with generous side gutters — emulates "magazine spread in the middle of the screen" |
| Tablet | 768 px | Black frame compresses to 4 px; ribbon-cards stack at full width inside |
| Mobile | < 480 px | Black frame to 2 px; two-column structure collapses to single column; left rail icon grid stacks above the right-column product stack |

#### Touch Targets
1996 had no notion of touch — the original designs assume mouse-only. Modern reproductions need to widen the icon-label nav targets to 44 × 44 px minimum at mobile (the 1996 icons sat at ~24 × 24 with 8 px label below, well under modern guidelines).

#### Collapsing Strategy
- At ≤ 768 px, the homepage's left-rail icon-link grid (Online Store / Service / Why Dell? / Government / Worldwide / Order Status / Company Info / U.S. Careers) collapses from a 2 × 4 grid to a single-column stack
- Ribbon-card right-edge product photo notch becomes a top-aligned full-width image at mobile
- The top banner's tagline ("BUILD YOUR OWN COMPUTER. ONLINE.") shrinks one type tier; the phone number wraps below the BUY-a-DELL sticker
- Footer icon-label nav stays 4-up at all widths — the icons are small enough to survive

#### Image Behavior
Product photos are bitmap GIFs with hand-applied bevel shadows — they were authored at fixed pixel widths (typically 80–120 px wide). The right-edge notch effect was achieved by table-cell negative spacing. Modern reproductions should keep the bevel shadow effect (it's signature) but use SVG drop-shadow or CSS `filter: drop-shadow(2px 2px 0 #000)` to recreate it crisply at high-DPI. On the dark canvas a hard black shadow is subtle, so keep the 1 px highlight edge of the bevel in a light tone to preserve the pinned-on look.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flush | No shadow, no border | Body text, copyright row, footer band background |
| 1 — Hairline | `1px solid {colors.hairline}` | Ribbon-card outer edge, table-cell dividers |
| 2 — Frame | `8px solid {colors.frame-ink}` + 1px `{colors.hairline}` inner edge | The page-frame border around the entire viewport |
| 3 — Bevel | Hard-edge 1 px highlight + 1 px shadow on GIF stickers and product photos | "BUY a DELL" sticker, NEW! bursts, award seals, product photographs |

There are **no soft shadows** in the 1996 design — every depth cue is either a hard 1 px border or a hand-painted bevel inside a GIF. Modern reproductions that need to feel period-accurate must resist the urge to add Material-style elevation or atmospheric drop shadows.

### Decorative Depth
Bevels and frames carry the entire depth vocabulary:
- The **page frame** is the strongest depth cue — it tells the viewer "this is a contained document, not a continuous canvas."
- **Bevels on stickers** (BUY a DELL, NEW!, PC Magazine Readers' Choice) push them forward off the page surface as if pinned on with thumbtacks.
- **Product photographs** carry their own hand-painted bevel + drop-shadow, baked into the GIF itself.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Universal default — buttons, cards, inputs, banners, page frame, ribbon-card bodies, eyebrow blocks |
| `{rounded.full}` | 9999px | Circular award seals (PC Magazine Readers' Choice), the round "h" sticker on the HOME icon |

The 1996 design has effectively **two** radius modes: square (everything) and round (decorative seal stickers). No 4 / 8 / 12 px subtle radius tier — that vocabulary belongs to the post-Bootstrap web.

### Photography Geometry
Product photos are rectangular GIFs with their own internal beveled "monitor" framing — they sit at native pixel dimensions, never scaled. Aspect ratios cluster around 4:3 (the era's standard CRT shape). Avatars don't exist on this site — staff photography was reserved for "About Dell" pages not captured in these snapshots.

## Components

> **No hover states documented.** Per the global no-hover policy, every component below documents Default state only.

### Frame & Banner

**`page-frame`** — the literal black border around the entire viewport.
- Background `{colors.frame-ink}`, 1 px inner edge in `{colors.hairline}`, padding `{spacing.sm}` 8 px on every side, no radius.
- The page sits *inside* this border. Treat it as a non-negotiable container chrome; collapsing it on mobile is acceptable (to ~4 px), but removing it entirely loses the brand.

**`top-banner`** — pure-black strip running across the top with parchment-white "BUILD YOUR OWN COMPUTER. ONLINE." headline + sub-tagline, the pale-gold "BUY a DELL" sticker pinned at right, and the Antique Gold "1-800-213-DELL" phone number.
- Background `{colors.frame-ink}`, text `{colors.ink}`, type `{typography.heading-2}`, padding 12 px vertical / 16 px horizontal, no radius.

### Section Eyebrow Blocks

**`section-eyebrow-olive`** — large tinted color block holding the chunky stenciled section title ("DIMENSION DESKTOPS"). Used at the top of the Dimension product page.
- Background `{colors.tint-olive}`, text `{colors.ink}`, type `{typography.display}` (Arial Black 36 / 900), padding 24 × 16, no radius.

**`section-eyebrow-salmon`** — same chrome with the OptiPlex line's salmon-pink fill ("OPTIPLEX DESKTOP SYSTEMS").
- Background `{colors.tint-salmon}`, otherwise identical to the olive variant.

### Ribbon Cards

The brand's signature component. Each product-row "card" is a stack of three pieces:
1. **`ribbon-card-title`** — dark horizontal title bar with the product variant name in Helvetica Bold all-caps (e.g. "OPTIPLEX GX PRO", "DIMENSION XPS", "POWEREDGE SERVERS"). 1 px bottom border in `{colors.hairline}`.
   - Background `{colors.surface}`, text `{colors.ink}`, type `{typography.heading-3}`, padding 6 × 12, no radius.
2. **`ribbon-card-body-<tint>`** — color-block body in one of eight tints, holding the short marketing pitch in `{typography.body}` (Times Roman 14). Padding 12 × 16. The product photograph notches into the right edge with a transparent GIF cutout.
3. **Photo notch** — the GIF sits in the rightmost ~25 % of the row, hanging slightly above and below the body bar like a card pinned to a corkboard.

Each tint variant is its own component entry. Pick the one that matches the product family:

- **`ribbon-card-body-sage`** — `{colors.tint-sage}` fill, used for Latitude Notebooks rows
- **`ribbon-card-body-salmon`** — `{colors.tint-salmon}` fill, used for OptiPlex GX Series rows
- **`ribbon-card-body-peach`** — `{colors.tint-peach}` fill, used for Dimension rows and OptiPlex Gs
- **`ribbon-card-body-lime`** — `{colors.tint-lime}` fill, used for OptiPlex G Series rows
- **`ribbon-card-body-sky`** — `{colors.tint-sky}` fill, used for Dellware rows
- **`ribbon-card-body-steel`** — `{colors.tint-steel}` fill, used for Dimension XPS Pro rows
- **`ribbon-card-body-periwinkle`** — `{colors.tint-periwinkle}` fill, used for PowerEdge Server rows

All seven share identical chrome: 1 px solid `{colors.hairline}` border, `{spacing.md}` × `{spacing.lg}` (12 × 16) padding, `{rounded.none}` (sharp corners), `{typography.body}` Times Roman 14 inside, set in light `{colors.ink}`. Only the fill color changes per product family.

### Call-to-Action

**`cta-block-gold`** — the homepage's signature Antique Gold panel ("At Dell.com, we'll help you find the right system, configure it, price it, and order it…").
- Background `{colors.primary}` (#c9a227), text `{colors.on-primary}` (black, #000000), 1 px solid frame-ink border (a crisp black keyline against the gold), type `{typography.body}` (Times Roman 14), padding 16 px, no radius.
- One per page maximum. The brand's most authoritative attention-grab — never use it for anything except a top-tier sales message.

**`phone-callout`** — top-right phone number ("1-800-213-DELL") rendered in gleaming Antique Gold on the black banner.
- Background `{colors.frame-ink}`, text `{colors.primary}`, type `{typography.heading-2}` Helvetica Bold 16, padding 4 × 8, no radius. Pinned to the right of the top banner on every page.

### Stickers (GIF-style overlays)

**`buy-a-dell-sticker`** — pale butter-gold rectangular sticker with "BUY a DELL" in Helvetica Bold, the "a" set in a small deep-purple stripe (`{colors.purple-stripe}`), the "DELL" wordmark in black. Pinned to the top-right of every page.
- Background `{colors.yellow-sticker}`, text `{colors.on-sticker}`, 1 px black border, type `{typography.button}`, padding 4 × 8, no radius.

**`new-burst-sticker`** — angled pale-gold burst with "NEW!" in Helvetica Bold black, overlapping the right side of new product ribbon-cards. Slight rotation (~15°) gives it the pinned-on-with-tape feel.
- Background `{colors.yellow-sticker}`, text `{colors.on-sticker}`, type `{typography.button}`, padding 4 × 8, no radius (rotation applied separately).

**`cert-seal`** — round Antique Gold award seal: center reads "PC MAGAZINE", ringed by "SERVICE · RELIABILITY · READERS' CHOICE", with an inner dark field and Antique Gold bordered ring. Sits on the right rail of product pages.
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, rounded `{rounded.full}`, 64 px size.

### Navigation

**`icon-label-nav`** — bottom-of-page navigation row: four hand-drawn icons (eyeglasses-FIND / house-HOME / sticker-ONLINE STORE / wrench-SERVICE & SUPPORT) connected by a thin green horizontal rule, each with an uppercase Helvetica label beneath.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.ui-label}`, padding 8 px around each icon-label pair, no radius.
- The connecting green rule is part of the GIF imagery, not a CSS border.

### Inputs & Buttons

**`text-input`** — bordered HTML input. Black fill, 1 px solid hairline border, parchment Times Roman 14 inside.
- Background `{colors.frame-ink}`, text `{colors.ink}`, 1 px solid hairline, type `{typography.body}`, padding 4 × 6, no radius.
- Used on the Search and "Configure & Buy" forms (not visible in these three captures but consistent with the era's HTML 3.2 form widgets).

**`button-primary`** — parchment-filled button with black Helvetica Bold uppercase label (the polarity flip of the light theme's black button; gold stays reserved for the CTA).
- Background `{colors.ink}`, text `{colors.frame-ink}`, 1 px solid ink, type `{typography.button}`, padding 6 × 16, no radius.

**`button-secondary`** — dark filled outlined button. Same chrome with inverted colours.
- Background `{colors.surface}`, text `{colors.ink}`, 1 px solid ink, type `{typography.button}`, padding 6 × 16, no radius.

**`button-text-link`** — bare underlined anchor in lightened Mosaic blue.
- Text `{colors.link}` #7aa2ff, type `{typography.link}` Times Roman 14, underline on default. No padding, no radius.

### Footer

**`footer-band`** — the bottom of every page: icon-label nav row, light-blue Copyright link, "(Terms of Use)" parenthetical, browser-compatibility small print, and the Microsoft BackOffice / Internet Explorer logo banners.
- Background `{colors.canvas}`, text `{colors.ink}`, 1 px top border in `{colors.hairline}`, type `{typography.body-sm}`, padding 16 px.

### Examples (illustrative)

> Auto-derived kit-mirror demonstration surfaces (`scripts/derive-examples-block.mjs`). Each `ex-*` entry references brand-native primitives so downstream consumers (`/preview-design`, `/generate-kit`) re-skin the same 10 surfaces consistently. `TO_FILL` markers indicate missing primitives — resolve in the LLM judgment pass.

**`ex-pricing-tier`** — Default Pricing tier card. Re-uses feature-card chrome with the base dark surface.
- Properties: `backgroundColor`, `textColor`, `borderColor`, `rounded`, `padding`

**`ex-pricing-tier-featured`** — Featured/highlighted tier — polarity-flipped surface (in this dark theme: light fill + dark text, so it stands out against the dark canvas).
- Properties: `backgroundColor`, `textColor`, `rounded`, `padding`

**`ex-product-selector`** — What's Included summary card — re-purposed for SaaS / B2B verticals (NOT a literal product gallery).
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-cart-drawer`** — Subscription summary — re-purposed for SaaS / B2B (line items per add-on, not literal cart).
- Properties: `backgroundColor`, `rounded`, `padding`, `item-divider`

**`ex-app-shell-row`** — Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator.
- Properties: `backgroundColor`, `activeIndicator`, `rounded`, `padding`

**`ex-data-table-cell`** — Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm.
- Properties: `headerBackground`, `headerTypography`, `bodyTypography`, `cellPadding`, `rowBorder`

**`ex-auth-form-card`** — Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-modal-card`** — Modal dialog surface — same chrome as feature-card with elevated shadow.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-empty-state-card`** — Empty-state illustration frame.
- Properties: `backgroundColor`, `rounded`, `padding`, `captionTypography`

**`ex-toast`** — Toast notification surface — feature-card shape + medium shadow.
- Properties: `backgroundColor`, `rounded`, `padding`, `typography`


## Do's and Don'ts

### Do
- Keep the literal `{components.page-frame}` black border on every page — this is the brand's single most identifiable container chrome (with its 1 px `{colors.hairline}` inner edge so it stays visible on the dark canvas), and it makes the `{colors.primary}` Antique Gold accents pop dramatically.
- Reserve `{colors.primary}` (Antique Gold `#c9a227`) for the `{components.cta-block-gold}` panel, the `{components.phone-callout}`, and the `{components.cert-seal}` only. Every other use dilutes the urgency signal.
- Always pair `{colors.primary}` fills with `{colors.on-primary}` (`#000000` black) text so body copy in Times New Roman remains sharp and legible. Likewise keep black ink (`{colors.on-sticker}`) on the pale-gold stickers.
- Set text on the dark canvas, surface and ribbon-card tints in `{colors.ink}` (#f4efe0) — never pure `#ffffff`, which glares against the warm near-black.
- Draw dividers and card edges with `{colors.hairline}`; pure black lines disappear on a dark page.
- Use the eight ribbon-card tint colors (`{colors.tint-olive}` / sage / salmon / peach / lime / sky / steel / periwinkle) as a *family* — pick one per product line and stay with it across the line's marketing surfaces.
- Set every display headline in `{typography.display}` (Arial Black 36 / weight 900). The brand's typographic register depends on extreme weight against flat color.
- Keep body copy in `{typography.body}` Times Roman 14 — substituting a modern sans loses the catalog feel entirely.
- Render every CTA / button at `{rounded.none}` (0 px). Modern soft-radius buttons betray the era.
- Use hand-painted bevels / hard-edge GIF shadows on stickers and product photos. Never substitute a soft CSS shadow.

### Don't
- Don't introduce a chromatic accent outside the eight catalog tints + Antique Gold + Sticker Pale Gold + the lightened link blue. The palette is closed by design.
- Don't put white or parchment text on `{colors.primary}` (`#c9a227`) — the luminance of Antique Gold requires black ink (`#000000`) for accessible contrast. Don't put black text on the deep ribbon-card tints either; they take `{colors.ink}`.
- Don't soften any corner. `{rounded.none}` is the universal modifier; only award seals get `{rounded.full}`.
- Don't replace Times Roman body with Arial / Helvetica / Inter / a webfont — the serif body is the era's signature.
- Don't add soft drop-shadows, glows or atmospheric gradients — and no glossy "dark mode" glow around the gold. The brand has hard borders and flat fills; everything else reads as anachronism.
- Don't crop or "tuck" product photos with `border-radius` or `clip-path`. The notch into the ribbon-card right edge is the framing — the photo itself stays a hard rectangle.
- Don't pair two `{components.cta-block-gold}` panels on the same page. The Antique Gold fill is meant to be the singular attention pole.
- Don't strip the `{components.phone-callout}` from the top banner. In 1996 the website existed to drive phone-call orders; the phone number IS the navigation.