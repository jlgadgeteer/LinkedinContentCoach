# LinkedIn Content Coach

This file is the starting context for Claude Code working on this project. Read it fully before doing anything else. It is not marketing or documentation; it is the operational brief.

## What we're building

An open-source web app that helps senior professionals draft LinkedIn posts in their own voice. Users deploy their own instance to Vercel (free tier), set a single password during deployment, log in from any device, paste their Claude or OpenAI API key, paste a voice profile, paste their post history, and start writing.

Four primary actions, action-oriented UI (not chat):
1. **Draft** a post in the user's voice from a topic
2. **Ideate** new post angles based on themes and recent work
3. **Search** the user's past posts before drafting something redundant
4. **Quality-check** a draft for AI tells and voice drift

The differentiator: this is configuration-as-product, not another LLM wrapper. The voice profile and skill prompts are explicit markdown files anyone can read, fork, and customize.

## Audience

Senior tech executives, founders, CIOs/CTOs, established thought leaders who write on LinkedIn as a professional practice. They are comfortable with technology but allergic to generic SaaS aesthetics. They draft in 5 to 15 minute windows between meetings, often on mobile, often dictating ideas they refine later.

## Architecture decisions (the why)

### Self-deploy, single-tenant by design

Each user clicks "Deploy with Vercel" in the README, which forks the repo to their GitHub and creates their own instance. Their instance, their data, their API spend. We never run anything centrally. This is the key architectural commitment — multi-tenant SaaS was explicitly considered and rejected because it weakens the "configuration as product" thesis and adds operational burden.

### Single password auth, set at deploy time

The user sets an `AUTH_PASSWORD` env var during Vercel deploy. On first login, it's hashed (bcrypt) and stored in their own Postgres. Cookie session via Auth.js v5 with credentials provider. Rate-limited (5 attempts/minute/IP). Forgot password = update env var in Vercel + redeploy.

Why not Google/Microsoft OAuth: requires the user to navigate Google Cloud Console or Azure AD to create an OAuth app, which is a 15-minute detour that breaks the "non-technical user can deploy" goal. Single password is the standard pattern for every self-hosted tool (Plex, Home Assistant, Vaultwarden) and works for 100% of users.

Why not magic-link email: requires the user to sign up for Resend or similar, adds another env var, breaks the zero-side-account principle.

### Postgres via Vercel's Neon integration

Vercel's marketplace includes a one-click Vercel Postgres (Neon-backed) integration. Free tier is plenty for a single-user instance. This replaces the IndexedDB approach in the v1 scaffold (which is being rewritten).

### Vercel AI SDK for LLM abstraction

Same code path supports Anthropic and OpenAI on day one. Adding Gemini/Ollama is a one-file change in `lib/llm.ts`.

### Edge runtime for the streaming API route

`app/api/generate/route.ts` runs on the edge for low-latency streaming. The auth route runs on Node for bcrypt compatibility.

## Current state of the code

A v1 scaffold exists in this repo and uses IndexedDB for client-side storage. That approach was rejected because it doesn't support multi-device use. **The v1 code is a starting point, not the target.** The migration to Postgres + auth is the work described in PLAN.md.

Files that carry over from v1 essentially unchanged:
- `lib/prompts/skills.ts` — the four skill prompts. The actual product IP.
- `lib/prompts/index.ts` — the prompt assembler. Minor tweaks may be needed.
- `lib/llm.ts` — the AI SDK abstraction.
- `lib/types.ts` — types (will be extended for new schemas).
- `app/api/generate/route.ts` — the route logic carries over; remove the `apiKey` from the request body since it'll be stored per-user in Postgres.

Files to be replaced or significantly rewritten:
- `lib/db.ts` — currently Dexie/IndexedDB. Becomes Drizzle/Postgres.
- `app/page.tsx`, `app/settings/page.tsx`, `components/workspace.tsx` — currently inline-styled. Becomes the designed screens.
- `app/globals.css` — currently a basic theme. Replace with `design/tokens.css`.
- `app/layout.tsx` — currently minimal. Update with the designed nav/layout.

## File organization

```
app/
  layout.tsx                 # Root layout, brand mark, theme provider
  page.tsx                   # Workspace (empty + populated states)
  login/page.tsx             # Single password entry
  setup/page.tsx             # 3-step wizard (post-login first run)
  settings/page.tsx          # All configuration (4 cards per design)
  draft/page.tsx             # Action: Draft a post
  ideate/page.tsx            # Action: Five angles
  search/page.tsx            # Action: Search past posts
  quality-check/page.tsx     # Action: Check a draft
  api/
    generate/route.ts        # Edge runtime, streaming. Powers all four actions.
    auth/[...nextauth]/route.ts  # Auth.js handler (Node runtime)
components/
  ui/                        # Hand-rolled primitives (Button, Input, Card, etc.)
  workspace/                 # Workspace-specific (ActionCard, RecentList)
  output/                    # OutputBlock, PostBlock, streaming bits
lib/
  db/
    schema.ts                # Drizzle schema
    index.ts                 # DB client
    migrate.ts               # Schema bootstrap (idempotent CREATE TABLE IF NOT EXISTS)
  auth.ts                    # Auth.js config + helpers
  llm.ts                     # Provider abstraction (carries from v1)
  prompts/                   # Skills + assembler (carries from v1)
  types.ts                   # Shared types
middleware.ts                # Auth gate on all routes except /login + /api/auth
design/                      # Design source of truth — DO NOT modify, read only
docs/                        # Background reference docs
```

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript 5
- Tailwind CSS v4 (CSS-based @theme, no tailwind.config.ts)
- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- Drizzle ORM + `@vercel/postgres`
- Auth.js v5 (`next-auth@beta`) with credentials provider
- `bcryptjs` for password hashing
- `zod` for runtime validation
- No shadcn/ui. Hand-rolled primitives only.

## Conventions

### Style and voice (in code AND in user-facing copy)

- **No em dashes.** Anywhere. Not in comments, not in commit messages, not in copy. Use commas, semicolons, parentheses, or restructure.
- **No emojis** in UI. No exclamation marks. No corporate filler.
- **No AI-magic language.** No "AI-powered", "magic", "smart", "intelligent", "powered by AI", "Welcome to your AI...".
- **No "Welcome aboard" or "Excited to" anywhere.**
- **Microcopy is functional, not coy.** Errors are specific and include status codes and partial output when relevant. Example: "Anthropic returned a 529 (overloaded) after 142 tokens. Your draft so far is below."
- **Direct peer-to-peer tone** in any user-facing text.

### Design fidelity

The design output in `design/` is high-fidelity and final on colors, typography, spacing, radii, and copy. Recreate UI pixel-perfectly. Use judgment only on interactions and animation timing, which are described qualitatively in `design/HANDOFF.md`.

The full design rationale lives in `DESIGN.md` (repo root). Read it.

### Anti-patterns (do not do these)

- No icons in primary navigation. Words.
- No gradients anywhere.
- No glowing buttons or sparkle effects.
- No skeleton loaders.
- No jumbo spinners. Streaming is a single 7px pulsing terracotta dot in the output block.
- No layout shift when the first token arrives. Output block reserves min-height.
- No shadow lift on hover for cards. Border color change only.
- No transform/scale on hover. Color transitions only.
- No content area filling the full viewport. Hard-cap at `content-prose` (720px) or `content-wide` (880px).

### Accessibility (non-negotiable)

- WCAG AA contrast verified for every text/background pair.
- `:focus-visible` rings on every interactive element. Never `outline: none` without replacement.
- Semantic HTML: `<header>`, `<main>`, `<aside>`, `<nav>`, `<section>`, `<article>`.
- Real `<label for>` associations on every input.
- Live region on the output block (polite, updates on `done`) for streaming completion announcements.

### Streaming behavior

When a Draft/Ideate/QC/Search action is submitted:
1. Primary button label becomes `<dot-pulse> + verb-ing` (e.g., "Drafting", "Ideating"), disabled state.
2. Output block fades in. No skeleton loader. Live indicator: 7px terracotta dot, `pulse 1.4s ease-in-out infinite`.
3. Streamed text appends token-by-token. Trailing caret is 7px terracotta block, height 1em, `blink 1s steps(2, end) infinite`. Caret only on live text, removed when streaming stops.
4. `min-height` reservation prevents layout shift.
5. Complete: indicator → faint dot, label → "Complete · N tokens", show `Copy` + `Quality check` ghost-sm buttons.
6. Fail: indicator → danger dot, label → "Request failed · {status}". Partial output preserved in muted text. `Try again` secondary-sm.

### Database conventions

- Single-user schema. There is no `users` table with arbitrary rows; there is one owner per instance whose hashed password lives in a `config` table.
- All TIMESTAMPs are `timestamptz` with default `now()`.
- Use Drizzle's `pgTable` definitions in `lib/db/schema.ts`.
- Migrations: prefer idempotent `CREATE TABLE IF NOT EXISTS` on app boot for simplicity. No separate migration tooling for v1.

### API and runtime

- `app/api/generate/route.ts` uses `export const runtime = "edge"`.
- Auth and any bcrypt code stays in Node runtime.
- API routes validate input with Zod before doing anything else.
- The user's stored API key is fetched server-side per request; never round-trip it to the client.

## Build commands

```bash
npm install
npm run dev           # Local dev on http://localhost:3000
npm run build         # Production build
npm run type-check    # TypeScript check (no emit)
npm run lint          # Next lint
```

For the database during local dev: set `POSTGRES_URL` in `.env.local` pointing at a local Postgres or a Vercel Postgres dev branch.

## What success looks like

When the work in PLAN.md is complete, a target user (a senior CTO scanning the GitHub repo) should think two things:

1. "This person knew what they were doing."
2. "I want to deploy this on my own Vercel."

If the implementation reads like another AI chat wrapper, something has gone wrong. Reach for restraint before reaching for chrome.

## Where to look for more

- `PLAN.md` — Phased build plan. The current work.
- `DESIGN.md` — Design rationale, lives in the repo.
- `design/HANDOFF.md` — Full designer handoff document with screen specs.
- `design/tokens.css` — Source of truth for colors, type, spacing.
- `design/screens.html` — Open in a browser to see every screen rendered.
- `design/primitives.html` — Open in a browser to see every UI primitive.
- `docs/` — Background context if you need the broader project history.
