# Handoff: LinkedIn Content Coach

## Overview

LinkedIn Content Coach is a self-hosted, open-source web app that helps senior professionals draft LinkedIn posts in their own voice. Each user deploys their own instance to Vercel, supplies their own Claude or OpenAI API key, and imports their LinkedIn post history. The app runs four discrete actions: draft a post, ideate topics, search past posts, and quality-check a draft.

This handoff covers the full visual design and the eight screens defined in the design brief.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes that show the intended look, layout, copy, and interactive feel. They are not production code to copy directly.

**Your task is to recreate these designs in the target codebase** (Next.js 15 App Router + React 19 + Tailwind v4, per the brief's technical constraints) using its established patterns. Keep the visual fidelity and the copy exact. Translate the static HTML into proper React components with state management and the streaming behavior described below.

## Fidelity

**High-fidelity.** All colors, typography, spacing, radii, and copy are final. Recreate the UI pixel-perfectly. The one place to use judgment is on interactions and animation timing, which are described qualitatively below — implement them in whatever way feels right within React.

## Stack and ground rules (from the brief)

- Next.js 15 App Router + React 19
- Tailwind CSS v4. CSS-based `@theme` block. No `tailwind.config.ts`.
- No shadcn/ui or other component library. Hand-rolled primitives.
- Light + dark mode auto-switched via `prefers-color-scheme`. Both modes are fully designed.
- Mobile-first responsive. Sidebar collapses to a menu under 768px.
- WCAG AA contrast, full keyboard navigation, semantic HTML, focus rings on all interactive elements.
- One user per deploy. Single-password auth, set during deployment.

## Files in this bundle

| File | What it is |
|---|---|
| `tokens.css` | **The Tailwind v4 `@theme` block.** Drop this into `app/globals.css` after `@import "tailwindcss";`. Defines every color, font, size, radius. |
| `tokens.html` | Visual reference for the tokens — palette swatches and type specimen in both modes. |
| `primitives.html` | The component library reference — every primitive (Button, Input, Card, etc.) rendered in light + dark with all variants. |
| `screens.html` + `screens.css` + `screens.jsx` + `screen-parts.jsx` + `design-canvas.jsx` | All 27 screen artboards on one canvas. Open `screens.html` to browse. |
| `DESIGN.md` | Short rationale meant to live in the repo. Ship this. |

Open the HTML files locally to browse the design. The screens canvas is pan/zoom — drag to pan, scroll to zoom.

## Design tokens

The full source of truth is `tokens.css`. Highlights below.

### Colors (oklch)

**Light mode**
```
--color-bg:            oklch(0.985 0.005 70)   /* warm off-white */
--color-surface:       oklch(0.995 0.003 70)   /* cards, inputs */
--color-subtle:        oklch(0.960 0.006 65)   /* hover, muted fill */
--color-sunken:        oklch(0.940 0.007 65)   /* output block, inset */
--color-border:        oklch(0.900 0.008 65)   /* hairline */
--color-border-strong: oklch(0.800 0.010 60)   /* focus, divider */
--color-fg:            oklch(0.220 0.012 55)   /* primary text */
--color-fg-muted:      oklch(0.480 0.012 60)   /* secondary text */
--color-fg-faint:      oklch(0.620 0.012 60)   /* placeholder, caption */
--color-accent:        oklch(0.530 0.130 35)   /* terracotta — primary CTA */
--color-accent-hover:  oklch(0.470 0.140 33)
--color-accent-soft:   oklch(0.950 0.025 40)   /* subtle bg tint, focus ring */
--color-accent-fg:     oklch(0.985 0.005 70)   /* text on accent */
--color-danger:        oklch(0.480 0.120 25)
--color-danger-soft:   oklch(0.955 0.020 25)
--color-success:       oklch(0.500 0.080 145)
--color-success-soft:  oklch(0.960 0.020 145)
```

**Dark mode** (auto via `prefers-color-scheme`, plus a `[data-theme="dark"]` manual override)
```
--color-bg:            oklch(0.185 0.008 55)   /* deep warm slate, NEVER black */
--color-surface:       oklch(0.220 0.008 55)
--color-subtle:        oklch(0.255 0.009 55)
--color-sunken:        oklch(0.165 0.008 55)
--color-border:        oklch(0.310 0.010 55)
--color-border-strong: oklch(0.400 0.012 55)
--color-fg:            oklch(0.940 0.008 70)
--color-fg-muted:      oklch(0.720 0.010 65)
--color-fg-faint:      oklch(0.550 0.012 60)
--color-accent:        oklch(0.720 0.130 38)   /* lifted for AA contrast */
--color-accent-hover:  oklch(0.780 0.130 38)
--color-accent-soft:   oklch(0.290 0.045 38)
--color-accent-fg:     oklch(0.165 0.008 55)
--color-danger:        oklch(0.700 0.130 28)
--color-danger-soft:   oklch(0.300 0.045 28)
--color-success:       oklch(0.720 0.090 145)
--color-success-soft:  oklch(0.280 0.030 145)
```

### Typography

```
--font-sans:  Inter (UI — every label, button, body)
--font-serif: Source Serif 4 (one editorial moment per screen — the rendered <post> block)
--font-mono:  JetBrains Mono (JSON, voice profile, metadata, kbd hints)
```

Scale (size / line-height / weight where set):
```
xs    12 / 16 / 500   eyebrows, status badges
sm    13 / 20 / 400   captions, dense UI
base  15 / 24 / 400   body
md    16 / 26 / 400   input text, settings body
lg    18 / 28 / 500   section header (h2)
xl    22 / 30 / 500   card title
2xl   28 / 36 / 500   page header (h1)
3xl   36 / 44 / 500   wizard / login hero
```

Tracking: `-0.011em` (tight) and `-0.018em` (tighter) on large sizes.

### Radii

```
--radius-sm: 4px   badges
--radius-md: 6px   buttons, inputs
--radius-lg: 8px   cards, output block
--radius-xl: 10px  reserved
```

No pill radii unless functionally necessary.

### Layout widths

```
--content-narrow: 640px  wizard, modal
--content-prose:  720px  main column (Draft, QC, Settings)
--content-wide:   880px  workspace home
```

The app should **never fill the width of a wide display.** Cap content even on a 27-inch monitor.

## Component primitives

Implemented in `primitives.html` with full variant matrices in both modes. Recreate as React components.

| Primitive | Variants | Notes |
|---|---|---|
| `Button` | `primary`, `secondary`, `ghost` × `sm`, `default`, `lg` | Primary is terracotta. Hover darkens. Focus is a 3px `accent-soft` ring. Disabled is 50% opacity. Streaming state replaces the label with `<dot-pulse> + "Drafting"` and disables the button. |
| `Input` / `Select` | text, password, select | Border is `border-strong` at rest, `accent` on focus with the `accent-soft` ring. Invalid uses `danger`. Disabled fills with `subtle`. |
| `Textarea` | prose, mono | Mono variant uses JetBrains Mono 13/21 for JSON and voice-profile markdown. |
| `Label` | with optional inline `hint` slot | 13/20 medium on fg. Hint is 12 on fg-faint. |
| `Card` | static, interactive | Surface fill + hairline border + 8px radius. Interactive lifts border to `border-strong` on hover. **No shadow lift, no tilt.** |
| `PageHeader` | h1, 28/36 | One per screen. Pairs with a mono `Eyebrow` for context. |
| `SectionHeader` | h2, 18/28 | Region inside a screen. |
| `Badge` | neutral, success, danger, accent | 24px high, 4px radius, always paired with a 6px colored dot. |
| `OutputBlock` | live, done, fail | Sits on `sunken` surface. Live uses a pulsing terracotta dot (`pulse 1.4s ease-in-out infinite`). Done uses a faint dot. Fail uses a danger dot. Streaming caret is a 7px terracotta block with `blink 1s steps(2, end) infinite`. **No skeleton loader, no jumbo spinner.** |
| `PostBlock` | — | The one editorial moment. `<post>` tags from the model render here: Source Serif on `surface`, 3px terracotta left border, 6px radius. Includes a mono meta line (`Draft · 184 words`). |

## Screens

All eight screens are designed in both modes. Browse `screens.html` for the full canvas. Below is what each screen does and what's specific to it.

### 1. Login (`/login`)

A calm, single-field entry to a personal instance. Not a sign-up.

- Centered card, 420px wide, on the page background.
- Brand mark top-left: serif `Content Coach` with a mono `v0.4 · personal` subtitle.
- Card contains: serif h1 `Welcome back.` (32px), muted lede, password input (`input--lg`), full-width primary button `Continue`.
- Footer note inside the card, mono, faint:
  > Self-hosted. Not a public service.
  > Forgot it? Reset in your Vercel project's environment variables.
- Repo link bottom-right of the page in mono faint.

### 2. First-time setup wizard (`/setup`)

Three steps, skippable, after the first login. Top of every step: brand mark left, `Step 0N of 03` mono eyebrow right. Below: a three-segment progress rule (top border colored per state: `done` = fg-faint, `active` = accent, future = border). Below: serif h1 step title, muted lede, the step's form. Footer: `Skip this step` ghost button left; `Back` secondary + `Continue` primary right. Last step's primary label is `Finish setup`.

**Step 1 — Connect a model.** Provider select (`Anthropic · claude-sonnet-4-5`, etc.) + API key password input. Help text: "We send a single test request to confirm it works, then encrypt it." Primary button on this step is `Test and continue`.

**Step 2 — Write a voice profile.** Single mono textarea (~280px tall) prefilled with an example markdown profile. Label includes `markdown · ~120 lines is plenty` hint.

**Step 3 — Paste your post history.** Single mono textarea expecting JSON (~280px tall). Help line below shows live detection: `Detected: 47 posts. Oldest 2023-06-04. Newest 2025-02-14.` Secondary action `Load from file` on the right.

### 3. Workspace, empty state (`/`)

First visit after setup. The four actions, nothing else.

- Layout: 220px sidebar nav (left) + main column (right). Main capped at `content-wide` (880px), padded 40/56.
- Page head: mono eyebrow `Workspace`, h1 `What are you writing today?`, right side has two badges: `47 posts loaded` (neutral) and `Voice profile active` (success).
- Body: 2×2 grid of action cards (`Draft a post`, `Ideate`, `Search past posts`, `Quality check`). Each card has a 17px title, a one-line description (max 36ch), and a mono keyboard shortcut (`⌘1`–`⌘4`) top-right.
- Footer line, faint, 12px: "Nothing here yet. Your drafts and checks will show up below once you run one."

### 4. Workspace, populated (`/`)

Same as empty, plus a **Recent** section below the action grid.

- `Recent` section header + `View all` ghost button.
- A list of items, each a row of `[when] [title] [kind]` separated by hairline borders.
- Kinds: `DRAFT`, `QC`, `IDEATE`, `SEARCH` (rendered as mono uppercase, faint).

### 5. Action · Draft (`/draft`)

The core flow. Three states designed: idle, streaming, complete.

**Idle.** Page head with mono right-side meta `USING VOICE · 47 EXAMPLES`. Topic textarea (96px tall) with placeholder copy. Footer row: `⌘↵ to draft` mono hint left; `Clear` ghost + `Draft` primary (disabled until topic has content) right. Below: a dashed-border 8px-radius empty placeholder, centered text `OUTPUT WILL APPEAR HERE` in mono faint.

**Streaming.** Topic textarea shrinks to ~72px (still editable). Right-side badge changes to `Streaming` (accent variant with pulse dot). Primary button shows `<dot-pulse> Drafting` and is disabled. Below: the output block, live indicator dot pulsing, partial response with a terracotta caret on the trailing word. Output-head right has a `Stop` ghost button.

**Complete.** Right-side meta becomes `312 TOKENS · 2.1s` mono faint. Below the topic, action row is just `Clear` + `Draft again`. Output block has `Complete · 312 tokens` done indicator and two ghost-sm buttons: `Quality check` and `Copy`. Inside the output block is the rendered `<post>` block — Source Serif, 3px terracotta left rule, mono meta `Draft · 184 words`.

### 6. Action · Ideate (`/ideate`)

Same chrome as Draft. Topic textarea (`Rough idea`). Primary button is `Five angles`. Output is a list of 5 numbered angle rows; each row has a 14/medium title, a 12/muted note explaining the angle's character ("Hot take. Builds on your 2024-09 thread."), and a `Draft this` secondary-sm button on the right.

### 7. Action · Search (`/search`)

Single-line `input--lg` query field instead of a textarea. Primary button `Search`. Below: section header `4 matches` + mono right meta `cosine ≥ 0.6`. Hits render as cards: each shows `[date]` and `[score]` in mono faint top-row, then the matching excerpt in Source Serif 15/24 below.

### 8. Action · Quality check (`/quality-check`)

Larger paste textarea (~140px) prefilled with a draft. Primary button `Check again`. Right-side meta: `4 ISSUES FOUND`. Findings section header + `ordered by severity` mono right.

Findings render as cards in a vertical stack. Each finding is a two-column grid: a mono `0N` index, then a column with the issue title (14/medium), an optional excerpt (Source Serif 14, muted, with a 2px `border-strong` left rule), and a fix paragraph (13/muted, with key actions in bold fg).

Example finding shape:
```
01  Generic AI opening
    "In today's fast-paced startup environment, hiring senior engineers is more important than ever."
    Cut the first sentence. The second sentence is your actual lead. Start with "Three things…"
```

### 9. Settings (`/settings`)

Single column, four cards, each with its own save action.

1. **Provider and API key.** Two-column grid: provider select + API key password input. Footer: `Last verified 4 min ago` left; `Test connection` secondary + `Save provider` primary right.
2. **Voice profile.** Mono textarea (180px) editing the markdown. Footer: `108 lines · 2.4 KB` left; `Revert` ghost + `Save voice` primary right.
3. **Post corpus.** Stats strip on a sunken inset surface: `POSTS · 47`, `RANGE · Jun 2023 → Feb 2025`, `INDEXED · Feb 14, 2025 · 09:21`. Footer: `Re-index` ghost-sm left; `Replace corpus` + `Add posts` secondary right.
4. **Backup and restore.** One sentence of help, then two secondary buttons right-aligned: `Restore from file`, `Download backup`.

Right side of the page header has a `Last saved 4 min ago` neutral badge.

### 10. States

- **Inline banner.** Appears at the top of the main column when something globally broken needs attention (e.g., 401 from the provider). Layout: 6px danger dot, `banner__title` + `banner__body`, right-side `Dismiss` ghost + `Open settings` secondary. Background is `danger-soft` with a `color-mix(danger 30%, border)` border.
- **Output failed.** Inside the output block: indicator dot becomes `danger`, label reads `Request failed · 529`. Body explains specifically what failed and **preserves the partial output** in muted text. Right-side has a `Try again` secondary-sm button. Specific over friendly: "Anthropic returned a 529 (overloaded) after 142 tokens. Your draft so far is below."
- **Mobile (<768px).** Sidebar collapses behind a `Menu` ghost button in a top app bar. Page header h1 drops to 24/30. Action cards stack vertically. Badges remain top of the content area.

## Interactions and behavior

### Streaming

- When the user submits a Draft / Ideate / QC request, the primary button replaces its label with `<dot-pulse> + verb-ing` (e.g., `Drafting`, `Ideating`, `Checking`) and becomes `[disabled]`.
- The output block fades in (no skeleton loader, no spinner). Indicator dot: 7px terracotta, animated `pulse 1.4s ease-in-out infinite` (scale 0.9 → 1.15, opacity 0.4 → 1).
- Streamed text appends token-by-token. The trailing caret is a 7px terracotta block, height 1em, animated `blink 1s steps(2, end) infinite`. The caret only renders on the live text; remove it when streaming stops.
- **No layout shift.** The output block has a `min-height` reservation so the page doesn't jump when the first token arrives.
- When streaming completes, the indicator dot becomes a faint static dot, the label becomes `Complete · N tokens`, and a `Copy` + `Quality check` ghost-sm pair appears in the output-head right.
- When streaming fails, the indicator becomes a danger dot, the label becomes `Request failed · <status>`, the partial output stays visible in muted text, and a `Try again` secondary-sm button appears.

### Focus rings

Every interactive element gets a 3px `accent-soft` ring with the `accent` border replacing the default `border-strong`. Apply on `:focus-visible` only, not `:focus`. Use this pattern in CSS, not Tailwind's default focus ring utility.

### Hover

- Primary button: background `accent` → `accent-hover`.
- Secondary button: background `surface` → `subtle`.
- Ghost button: background `transparent` → `subtle`, color `fg-muted` → `fg`.
- Input/select: border `border-strong` → `fg-faint`.
- Interactive card: border `border` → `border-strong`. No background change. No transform.

All transitions: `120ms ease`.

### Keyboard

- `⌘1`–`⌘4` jump to the four workspace actions (shown in the nav and the action cards).
- `⌘↵` submits the active action's primary form (Draft, Ideate, Search, QC).
- `Esc` cancels a streaming request (same effect as `Stop`).

### Responsive

- Mobile (<768px): sidebar collapses behind a `Menu` button. The page-head wraps; badges drop below the title. Action cards stack vertically (single column). Wizard pads down to 24px horizontal.
- Desktop content width is hard-capped at `content-prose` (720px) for the action views and Settings, `content-wide` (880px) for the workspace home. Never full-bleed.

## State management

These are the state hooks each surface needs. Implementation choice (Zustand, Context, server state, etc.) is yours.

- **Auth.** Single password verified at `/login`. Successful login sets a session cookie. Routes are gated.
- **Setup status.** Boolean — has the user completed setup? Set by the wizard's `Finish setup`. Drives whether `/` redirects to `/setup` on first visit.
- **Provider config.** `{ provider, model, apiKey }`. Stored encrypted in Vercel project env. Surfaced read-only-with-edit in Settings.
- **Voice profile.** Single markdown string. Persisted via a save action. The header `Last saved Nm ago` badge updates on save.
- **Corpus.** Array of `{ id, publishedAt, text }`. Indexed on save. Settings shows `posts`, `range`, `indexed at`.
- **Active stream.** Per-action: `{ status: 'idle' | 'streaming' | 'done' | 'fail', text, tokens, durationMs, error }`. The output block reads from this. Streaming uses SSE or fetch with `ReadableStream`.
- **Recent.** Array of `{ at, kind, title, ref }`. Append on each completed action. Workspace populated reads this; empty state hides the section.

## Copy guidance

Lift the copy in the design exactly. The tone is intentional and was discussed in the brief:

- Direct, peer-to-peer.
- No corporate filler. No "Welcome to your AI-powered…" anywhere.
- No emojis. No exclamation marks. No em dashes.
- Microcopy is functional, not coy.
- Error messages are specific, not friendly-vague. Always include the provider's status code and the partial result when relevant.

## Assets

No images or icons are used. Words and color are the only chrome. If you find yourself wanting to add an icon to the nav, sidebar, or action cards, **don't.** The brief is explicit: no decorative icons in primary navigation.

Fonts are loaded from Google Fonts: Inter (400, 500, 600), Source Serif 4 (italic + roman, 400/500), JetBrains Mono (400, 500).

## Accessibility checklist

- WCAG AA contrast on every text/background pair (verified in tokens.html).
- All interactive elements reachable by Tab, in DOM order.
- `:focus-visible` rings on every interactive element. Never `outline: none` without replacement.
- Semantic HTML: `<header>`, `<main>`, `<aside>`, `<nav>`, `<section>`, `<article>` where appropriate. Findings use `<article>`. Post block uses `<article>`.
- Forms use real `<label for>` associations.
- Streaming announces completion to assistive tech (live region on the output block, polite, updates on `done`).

## What success looks like

From the brief: when a senior CTO scans the GitHub repo, two things should land:

1. "This person knew what they were doing."
2. "I want to deploy this on my own Vercel."

If your implementation reads like another AI chat wrapper, something has gone wrong. Reach for restraint before reaching for chrome.
