---
name: fintrace
description: A personal ledger you carry, check and update in seconds.
colors:
  warm-paper: '#f6f5f2'
  ink: '#1a1a1a'
  card: '#ffffff'
  primary: '#1a1a1a'
  primary-foreground: '#ffffff'
  secondary-paper: '#edeae3'
  muted-paper: '#f0ede7'
  accent-paper: '#f3f1ec'
  muted-ink: '#5e5a52'
  border: '#e6e3dc'
  input-border: '#8a857b'
  outline: 'transparent'
  ring: '#1a1a1a'
  destructive: 'oklch(0.51 0.228 27.325)'
  positive: '#1f6e36'
  warning: '#d97706'
  warning-soft: '#fdf6e3'
  warning-border: '#e8b860'
  warning-foreground: '#7a4a05'
  workspace-blue: '#2f5fd0'
  workspace-blue-soft: '#e8eefb'
  workspace-rust: '#c2410c'
  workspace-rust-soft: '#fbede5'
  workspace-teal: '#0f766e'
  workspace-teal-soft: '#e3f2f0'
  workspace-violet: '#6d28d9'
  workspace-violet-soft: '#efe8fb'
  workspace-amber: '#ad4f08'
  workspace-amber-soft: '#fbf0e1'
  workspace-magenta: '#be185d'
  workspace-magenta-soft: '#fbe7f0'
  workspace-olive: '#49760e'
  workspace-olive-soft: '#eef4e1'
  workspace-sky: '#0369a1'
  workspace-sky-soft: '#e3f0f8'
typography:
  display:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '2.25rem'
    fontWeight: 800
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '2rem'
    fontWeight: 800
    letterSpacing: '-0.025em'
  section:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '1.375rem'
    fontWeight: 800
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 700
  figure:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 700
    fontFeature: 'tnum'
  body:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
  caption:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 400
  micro:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '0.625rem'
    fontWeight: 800
  label:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    letterSpacing: '0.025em'
  tile:
    fontFamily: 'Manrope Variable, system-ui, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 400
    lineHeight: 1.25
rounded:
  md: '9.6px'
  control: '10px'
  lg: '12px'
  xl: '16.8px'
  card: '21.6px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  2xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.lg}'
    height: '44px'
  button-workspace-action:
    backgroundColor: '{colors.workspace-blue}'
    textColor: '{colors.card}'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '0 16px'
  input:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    height: '32px'
  pill:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.full}'
    height: '44px'
    padding: '0 14px'
  panel:
    backgroundColor: '{colors.card}'
    rounded: '{rounded.card}'
    padding: '20px'
  amount-field:
    backgroundColor: '{colors.card}'
    typography: '{typography.display}'
    rounded: '{rounded.card}'
    padding: '8px 16px'
---

# Design System: fintrace

## Overview

**Creative North Star: "The Pocket Balance Sheet"**

fintrace is a compact instrument for checking and updating your money in seconds, mostly one-handed on a phone. Warm paper, near-black ink and heavy Manrope headings give it the plainness of a sheet of figures; large tiles, capsules and swipes make it something you handle rather than read.

The interface is neutral until a workspace opens. Then the workspace's own colour floods the page as a soft tint and marks what is active and what is chosen, so you always know which sheet you hold. Everything else stays ink on paper, and figures stay the darkest, heaviest thing in a row.

Nothing about it should read as banking-app corporate (navy, stock trust signals, formal distance) or gamified budgeting (mascots, streaks, confetti, cheerful nudges about spending).

**Key Characteristics:**

- Thumb-first: tiles, capsules, bottom tabs and swipes lead, and desktop inherits them.
- One changing colour per workspace on an otherwise neutral, warm base.
- Tabular figures everywhere, in a heavy weight where they matter.
- Flat surfaces separated by tint, thin borders and white.
- Soft, generous shapes around strict alignment.

## Colors

A warm neutral base carries one workspace-picked accent; meaning colours appear only where they mean something.

### Primary

- **Ink** (primary): the default action outside a workspace, and all main text.
- **Workspace Accent** (one of the eight `workspace-*` values, as `--ws`): inside a workspace, the primary action, active tab, chosen tile ring and swipe-to-repeat. The colour is derived from the workspace's id, so it is stable across devices, and white text must stay readable on every accent. Accounts and categories draw from the same palette, keyed by their own ids, for their avatars.

### Secondary

- **Workspace Tint** (the matching `workspace-*-soft`, as `--ws-soft`): the whole page background inside a workspace, plus active navigation and full-screen forms.

### Neutral

- **Warm Paper**: page background outside a workspace.
- **Card**: every raised surface; white on tint is the main way the system separates things.
- **Secondary, Muted and Accent Paper**: quiet fills for icons, hover and secondary buttons.
- **Muted Ink**: captions, labels, inactive tabs, supporting lines.
- **Border**: pale hairlines around cards. Dashed add tiles use Muted Ink at 30%, so they hold on the tint.
- **Input Border**: 3:1 edges on bordered form controls.
- **Outline**: the edge of the white capsules on the tint, transparent today: white on tint and their own text identify them. Its own token, so an edge can be tried without touching the fields.
- **Ring**: focus indication.

### Meaning

- **Positive**: income figures only.
- **Destructive**: errors, invalid fields, destructive actions and swipe-to-delete.
- **Warning** family: a difference between computed and observed balances, and nothing else today.

### Named Rules

**The One Sheet Rule.** Only the current workspace's colour may tint the page. A second accent competing with it is a defect; account and category colours stay inside their own avatars.

**The Expenses Stay Ink Rule.** Income is green; expenses are plain ink with their sign. Red is reserved for errors and destruction, so spending never reads as a mistake.

## Typography

**Body and Display Font:** Manrope Variable (with system-ui, sans-serif)

**Character:** One geometric family does everything. Hierarchy comes from weight, from regular up to extra-bold, with slight negative tracking on large sizes.

### Hierarchy

- **Display** (extra-bold, 36px): the amount being typed in the operation and transfer forms.
- **Headline** (extra-bold, 24px on phones, 32px from `md`): page titles.
- **Section** (extra-bold, 22px): major headings within a page.
- **Title** (bold, 16px): panel headings.
- **Figure** (bold, 15px, tabular, `text-row`): amounts in feeds and names in lists; semibold 14px on nested rows. Headline figures on tiles and cards are 24px extra-bold.
- **Body** (regular to medium, 14px): default interface text. Inputs are 16px on phones so that focusing one does not zoom the page, and 14px from `md`.
- **Caption** (13px, `text-caption`): form labels, day headings and hints.
- **Hint** (11px, Muted Ink at 85%, the floor for AA on a card): a quiet one-line pointer to a gesture or a feature, below the content it explains. Never for anything the user must read.
- **Label** (semibold, 12px, uppercase, slight tracking): card headings in forms.
- **Micro** (extra-bold, 10px): initials on badges and small icons, and nothing else. It is the floor.
- **Tile** (11px, tight leading, up to two lines): names under tiles and bottom-tab labels. On a page of tiles, with no form competing for the room, names are medium weight at 12px on phones and 14px from `md`.

### Named Rules

**The Tabular Rule.** Numerals are tabular across the whole document, set once on the root. Never turn it off for a component, because figures must align in a column.

## Layout

Mobile-first, one column by default, widening at `md` (768px). Phones get a sticky top bar with a workspace pill, a sticky page header beneath it (68px offset), and a fixed five-tab bottom bar respecting the safe area. From `md`, a 240px sticky sidebar replaces them.

Content is capped at 1152px with 16px gutters on phones and 32px from `md`. Spacing follows a 4px rhythm: 8, 12 and 16px within components, 20px inside cards, 24px between larger groups. Touch targets are about 44px, and buttons from the kit are raised to that height on phones. Tile pickers use four columns.

Forms that matter are full-screen on phones, on the workspace tint with their action pinned at the bottom, and a centred dialog from `md`.

## Elevation & Depth

The system is flat. Depth comes from white cards on tinted paper and from hairline borders. A shadow means something floats above the page: dialogs, sheets, menus, popovers, the cookie notice and the floating jump button.

### Shadow Vocabulary

- **Float** (`shadow-md`, with a 10% ink ring on popovers and menus): menus, popovers, floating buttons.
- **Overlay** (`shadow-lg`): sheets and the cookie notice.
- **Card Hover** (`shadow-md` on hover): workspace cards on the workspaces page only, the one exception to the rule below.

### Named Rules

**The Shadow Means Floating Rule.** Surfaces at rest in the page have no shadow. If it scrolls with the page, separate it with tint or a border instead.

## Shapes

Generously rounded, with radius growing with size: about 10px for controls and small avatars, 12px for kit buttons and inputs, about 22px for cards and lists, and full circles for pills, tiles and round buttons. Full-screen phone forms lose their radius entirely. Radii derive from a 12px base; 10px is the one deliberate value outside that scale.

## Components

**Tactile and direct: controls feel pressable and sized for a thumb, with the action one tap or one swipe away.**

### Buttons

- **Shape:** gently curved (12px), or 10px for workspace actions.
- **Primary:** ink fill, white text; inside a workspace, the main action uses the workspace accent, bold, 44px tall.
- **Hover / Focus:** fill drops to 80–85%; a 3px soft ring on focus; pressing nudges the button down 1px.
- **Secondary / Outline / Ghost:** quiet paper fill, a hairline on the background, or no fill until hover.
- **Destructive:** a 10% red tint with red text, reserving the solid fill for the moment of commitment.

### Pills

- **Style:** white capsule, 44px tall on phones and 36px from `md`, medium weight, on the workspace tint, with a small muted chevron or icon.
- **Use:** says what is chosen and opens something, such as the account or the date.

### Cards / Containers

- **Corner Style:** about 22px.
- **Background:** Card.
- **Shadow Strategy:** none at rest.
- **Border:** hairline, or none on full-screen forms where white on tint is enough.
- **Internal Padding:** 20px.

### Inputs / Fields

- **Style:** hairline, 12px radius, transparent fill. Search inside a card is a borderless capsule on Muted Paper, as the workspace tint would read as a hole through to the page.
- **Focus:** border shifts to Ring with a 3px soft ring.
- **Error / Disabled:** red border and soft red ring; disabled fades to 50%.

### Navigation

- **Phone:** five bottom tabs, icon above an 11px label; active turns bold in the workspace accent.
- **Desktop:** sidebar rows of at least 44px, led by a 6px dot; active fills with the tint, turns bold and colours the dot.

### Entity Tile

The signature picker: a 52px round icon in the entity's own colour, with its name below in up to two lines. A chosen tile wears a full ring in the workspace accent; a tile on the way to the chosen one, such as its parent, wears a soft ring. A category with subcategories carries their count in a neutral badge on the icon's corner.

### Feed Row

A dense list row inside one rounded card, split by hairlines: icon, name and detail, then the right-aligned figure. Rows are grouped by day. On a phone, swiping left reveals delete and swiping right reveals repeat, both deepening in colour once letting go would act. A row reached by a jump highlights in the tint and fades over 1.8s. A swipe's delete waits 5s behind an ink bar with Undo, above the bottom tabs and above any other floating notice.

### Amount Field

A borderless white card with the figure at Display size, its sign part of the figure, green for income and ink for expense.

## Do's and Don'ts

### Do:

- **Do** take a workspace's colour from `--ws` and `--ws-soft`, set by `accentOf()`, and never hard-code one.
- **Do** define new colours as tokens in `src/index.css`, in both `:root` and `.dark`. Dark mode is planned, so new components must work in both, even though nothing switches it on yet.
- **Do** make every control usable without hover and about 44px tall on phones.
- **Do** keep transitions short: 100ms for overlays, 200ms for sheets and swipes.
- **Do** honour reduced motion for anything that loops.

### Don't:

- **Don't** drift towards banking-app corporate: navy, stock trust signals, formal distance.
- **Don't** add gamified budgeting: mascots, streaks, confetti or cheerful nudges about spending.
- **Don't** put a shadow on a surface at rest in the page.
- **Don't** colour expenses red.
- **Don't** add a second typeface, or switch off tabular numerals.
