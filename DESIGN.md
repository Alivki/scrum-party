# Design

## Theme

Single light theme. The site is a printed object, not a console; dark mode would betray the metaphor. Physical scene: a Risographed A2 poster taped above the snack table at a venue lit by overhead fluorescents, glanced at by a phone-toting student who tilts the screen toward their friend.

## Color (OKLCH, committed strategy)

Strategy: **Committed.** One hot ink carries a large share of the surface (~25%): risograph red. Everything else is paper or near-black ink. A cobalt blue exists in the palette but appears under 3% of the surface (one specific data-vis line and one secondary stamp).

| Role | Token | OKLCH | Hex (approx) | Use |
|---|---|---|---|---|
| Paper | `--paper` | `oklch(0.94 0.012 80)` | `#efe9dd` | Page background. The base sheet. |
| Paper-tint | `--paper-2` | `oklch(0.91 0.014 80)` | `#e6dfd0` | Sub-surfaces, table rows on hover, second-level sections. |
| Ink | `--ink` | `oklch(0.18 0.01 60)` | `#1a1612` | Body text, headlines, hard rules. Never `#000`. |
| Ink-2 | `--ink-2` | `oklch(0.32 0.008 60)` | `#3c352e` | Secondary text, labels. |
| Ink-3 | `--ink-3` | `oklch(0.55 0.006 60)` | `#7e756b` | Tertiary metadata. |
| Hot | `--hot` | `oklch(0.62 0.22 28)` | `#ef3a23` | The protagonist. Headlines on a stamp, active rank, primary action, the burndown line. |
| Hot-tint | `--hot-tint` | `oklch(0.94 0.05 28)` | `#fbe2dc` | Pale red wash under sticker labels and selection states. |
| Cobalt | `--cobalt` | `oklch(0.40 0.18 264)` | `#1f3aa6` | Reserved: the ideal-velocity line on the burndown, one stamp. Never decorative. |
| Mute | `--mute` | `oklch(0.85 0.012 80)` | `#d8d1c1` | Disabled, dividers between secondary blocks. |

Forbidden in this design: `#000`, `#fff`, any gradient on text, any colored side-stripe accents on cards, any glass blur.

## Typography

Type direction: **Brutalist editorial.** Heavy condensed display, neutral grotesque body, mono numerals.

Font stack — all loaded from Google Fonts:

- **Anton** (display) — extreme condensed bold. Used at sizes 40–160px for headlines, the wordmark, oversized numerals.
- **Familjen Grotesk** (body) — humanist grotesque. Used at 14–18px for UI and prose.
- **JetBrains Mono** (numerals & code) — fixed-width. Used for points, units, timestamps, story IDs.

Scale, with explicit ratios:

| Step | Size | Use | Weight |
|---|---|---|---|
| Display XL | clamp(72px, 12vw, 180px) | The Scrumfest wordmark on the join screen | Anton 400 |
| Display L | clamp(40px, 6vw, 72px) | Section headlines on the dashboard | Anton 400 |
| Display M | 32px | Card headlines, dialog titles | Anton 400 |
| Numeral XL | clamp(56px, 10vw, 120px) | Leaderboard rank, total story points | JetBrains Mono 700 |
| Numeral L | 40px | Issue card points, alkoholenheter total | JetBrains Mono 700 |
| H3 | 18px | Sub-headings, leaderboard names | Familjen Grotesk 600 |
| Body | 15px | Prose, descriptions | Familjen Grotesk 400 |
| Body S | 13px | Form labels, captions | Familjen Grotesk 500 |
| Caption | 11px, tracking 0.18em, uppercase | Stamp labels, ledger column headers | Familjen Grotesk 600 |

Line length: cap at 65ch on body prose. Lock numerals to `font-variant-numeric: tabular-nums`.

Heading characters are tightly tracked (-0.02em on Display). Captions are widely tracked (+0.18em). Body sits at default.

## Components

### Hard rule

The structural element of the whole site. A 4px solid `--ink` horizontal line, full-width, never with margin collapsing it. Use to separate sections. Above important blocks, place a 4px rule, a 12px gap, then the content. Below: optional 1px hairline if a sub-section follows.

Composite "double rule" variant: 4px rule + 6px gap + 1px hairline. Used once per page max, above the primary headline.

### Stamp

A red rectangular tag, ink text on `--hot`, slightly rotated (≤2deg) for printed feel. Use for: primary CTA, leaderboard rank #1, "ISSUE LUKKET" overlay on done cards, badge labels in the masthead. Never glowing, never gradient. The rotation alternates direction across the page so it never looks like a pattern.

### Sticker label

A thin black-outlined tag (`border: 1.5px solid --ink`, no fill OR `--paper-2` fill) with monospace caption text. Used for metadata: ABV, ml, drink-name preset. Always uppercase, always tracked 0.14em.

### Tile (replaces card)

A bordered box with a strong top rule (4px solid `--ink`), no shadow, no radius, no glass. Header inside the tile uses Display M with a numeric prefix (e.g. "01 / BACKLOG"). Body content sits with generous 24px gutter padding. Tiles share borders where adjacent (use grid + gap 0 with overlapping borders) to read like a sheet, not stacked cards. Never nest tiles inside tiles.

### Numeric headline

A standalone number set in Numeral XL, ink-coloured, with a Caption directly underneath, in `--ink-3`. Sits flush-left within its tile. Used for: total points, current rank, alkoholenheter total. Right-aligned variant exists for table rows.

### Form field

Floor-line input: no box. Just `border-bottom: 2px solid --ink`, 0 horizontal padding, Body size. Label sits above as a Caption. On focus: bottom border thickens to 4px and switches to `--hot` (the only place red appears purely from interaction state). On error: bottom border stays ink but a red Caption line appears below.

### Button

Three variants. None have rounded corners; all are sharp rectangles.

- **Primary**: solid `--hot` background, `--paper` text, Anton or Familjen Grotesk 700 uppercase, padding 18px 24px, tracking 0.06em. On hover: shifts 2px down-right and a 2px ink shadow appears in the up-left, like a stamp pressed harder.
- **Secondary**: ink-outlined transparent, `--ink` text. Same geometry, same press behaviour.
- **Quiet**: text-only, underline on hover, ink-2.

### Kanban column

Renders as a column of stacked tiles separated by 1px hairlines, not a box. Header: 4px rule + Display M + Caption count, e.g. "01 / BACKLOG · 4 issues · 14 pt." The "DONE" column header gets the red treatment.

### Kanban card

Single hairline border, paper background. Title in H3 ink, drink name in caption ink-3. Numeral L points float right, tabular-nums. When marked done: a slight 1-deg rotation, a small red "LUKKET" stamp absolute-positioned top-right, body text struck through ink-3.

### Burndown chart

- Axes: `--ink` 1px, tick text JetBrains Mono 11px in `--ink-3`.
- Grid: hairline `--mute`.
- "Remaining" line: 3px solid `--hot`, step-after interpolation, dots at every data point (3px solid `--hot`, no halo).
- "Ideal" line: 1.5px solid `--cobalt`, dashed 6-4.
- No area fill, no gradient. The line is the line.
- The chart background is `--paper`. Bordered above and below with hard rules.

### Avatar

Hard square or hard circle, ink-2 1.5px border, no ring, no glow. Fallback: bone-paper background with Anton 24 uppercase initials in `--ink`. Optional red "stamp" small badge top-right for the #1-ranked user.

## Layout

The page is composed as a single asymmetric ledger, not a grid of cards.

- **Masthead** sits at the top of every page, full-bleed, with a 4px rule beneath.
- **Two-column ledger** on desktop: 7-column main, 5-column rail, on a 12-col grid. Both columns share borders.
- **No max-width container** on the masthead or the leaderboard table. Edge-to-edge.
- Gutter: 32px on desktop, 16px on mobile. Inner padding inside tiles: 28px.
- Tiles touch one another by sharing borders, no gap between them. Use `gap: 0` and `+1px` overlap to achieve this.
- Vertical rhythm: pad section above headlines with 64px on desktop, 32px on mobile. After the closing rule of a section, only 16px before the next one starts.

## Motion

- All transitions: 120–220ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart).
- Buttons "press" by translating 2px diagonally; no scale, no glow, no bounce.
- Stamps appear (after a successful action) with a 180ms opacity + 4-deg rotation settle.
- The burndown line draws on mount via `strokeDasharray`, 320ms, once.
- `prefers-reduced-motion: reduce` flattens all of the above to opacity-only crossfades.

## Imagery & iconography

- No stock photos. No gradient backgrounds. No SaaS-style isometric illustrations.
- Iconography: `lucide-react` set, used at 16/20/24px with 1.75px stroke. Treat icons as ink, never coloured.
- Decorative marks (registration crosses, page numbers, sprint number) printed in `--ink-3` JetBrains Mono at 11px in the corners of tiles.

## Anti-patterns to actively refuse

- Glassmorphism: forbidden. There is no `backdrop-filter` in this design.
- Gradient text: forbidden.
- Side-stripe accents: forbidden (use full borders or stamps instead).
- Rounded buttons: forbidden. Sharp corners everywhere except the avatar (which is a circle on purpose, like a passport photo).
- Confetti or emoji rain: never. We are a poster, not a screensaver.
