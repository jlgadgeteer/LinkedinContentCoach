# Build Plan

The work to take the v1 IndexedDB scaffold to the v2 self-deployable, Postgres-backed, auth-gated, designed product. Phases are sequential. Each phase has explicit acceptance criteria. Mark phases done by checking the boxes here.

## Where we are now

The repo contains a working v1 scaffold that uses IndexedDB for client-side state. It runs (`npm run dev` works) and the prompt assembler, LLM abstraction, and four skill prompts are battle-tested. The UI is functional but inline-styled. There is no auth, no backend storage, no design system applied.

The design output lives in `design/` and is treated as source of truth. The handoff doc in `design/HANDOFF.md` is comprehensive.

## Phase 1: Foundation (design tokens + dependencies) ✅

**Goal:** the app boots with the design system applied, using the new dependency set.

- [x] Update `package.json` to add: `drizzle-orm`, `drizzle-kit` (devDep), `@vercel/postgres`, `next-auth@5.0.0-beta.x`, `bcryptjs`, `@types/bcryptjs` (devDep). Keep existing AI SDK and Zod deps.
- [x] Replace `app/globals.css` with the contents of `design/tokens.css`. This gives Tailwind v4 the full `@theme` block and dark-mode variant.
- [x] Add Google Fonts loading (Inter 400/500/600, Source Serif 4 400/500 with italic, JetBrains Mono 400/500) via `next/font` in `app/layout.tsx`.
- [x] Update `app/layout.tsx` per design: brand mark in header (serif "Content Coach" + mono version subtitle), narrow content cap, footer note.
- [x] Run `npm run dev` and verify both light and dark mode render with the warm paper aesthetic.
- [x] Bonus, per user direction on day 1: ship a `ThemeToggle` component (System / Light / Dark, words only, mono uppercase) with localStorage persistence and a no-flash inline script in `<head>`. Manual choice beats the OS preference; no-JS users still get OS-appropriate dark via a `:not([data-theme])` media-query fallback.

**Acceptance:** open `http://localhost:3000`. The page should feel like a writer's tool, not the current v1 inline-styled scaffold. Toggle OS dark mode and verify the theme switches.

## Phase 2: Database schema + migration ✅

**Goal:** the app has a Postgres backing store with the schema defined.

- [x] Create `lib/db/schema.ts` with these tables (single-tenant, no `users` table needed):
  - `config` — singleton row holding: `password_hash`, `provider`, `model`, `encrypted_api_key`, `setup_completed_at`, `last_verified_at`
  - `voice_profile` — singleton: `markdown`, `updated_at`
  - `posts` — many rows: `id`, `external_id`, `published_at`, `url`, `hook`, `text`, `word_count`, `created_at`
  - `recent_actions` — for the workspace's "Recent" section: `id`, `at`, `kind` (DRAFT|IDEATE|SEARCH|QC), `title`, `ref`
- [x] Create `lib/db/index.ts` exporting a configured Drizzle client using `@vercel/postgres`.
- [x] Create `lib/db/migrate.ts` exporting an `ensureSchema()` function that runs idempotent `CREATE TABLE IF NOT EXISTS` for each table. This runs on app boot.
- [x] Hook `ensureSchema()` into a Next.js server-side bootstrap (via `instrumentation.ts`, which Next.js calls once per Node worker on cold start; skipped on edge and when `POSTGRES_URL` is unset).
- [x] Delete `lib/db.ts` (the Dexie file). Remove `dexie` and `dexie-react-hooks` from deps. Replaced v1 `app/page.tsx`, `app/settings/page.tsx`, and `components/workspace.tsx` with minimal placeholders for now (Phases 6 and 8 land the designed versions).

**Acceptance:** with `POSTGRES_URL` set in `.env.local`, the app boots and the tables exist. `psql` shows the schema.

## Phase 3: Auth (Auth.js v5 + middleware) ✅

**Goal:** the app is gated behind a single-password login.

- [x] Create `lib/auth.ts` with Auth.js v5 setup:
  - Credentials provider that calls a `verifyPassword(input)` function
  - JWT session strategy
  - `signIn` callback rate-limits failed attempts in-memory (5/min/IP)
- [x] Create `app/api/auth/[...nextauth]/route.ts` per Auth.js v5 docs (Node runtime).
- [x] Create `middleware.ts` at the repo root: protect all routes except `/login`, `/api/auth/*`, and static assets. Redirect unauthenticated requests to `/login` with a `from` query param.
- [x] Create `app/login/page.tsx` per the design: centered 420px card, "Welcome back." serif h1, password input, full-width primary button "Continue", footer note "Self-hosted. Not a public service." Bottom-right repo link.
- [x] On first ever login (no `password_hash` row in `config` yet), accept the password from `AUTH_PASSWORD` env var, hash it, store it, then log the user in. Subsequent logins compare against the stored hash.
- [x] Enforce ADR-002 mitigation: 12-character minimum on the bootstrap password (`AUTH_PASSWORD`). Mismatched / too-short env values fail closed.
- [x] Split the config so middleware loads only the edge-safe stub (`lib/auth.config.ts`); the Credentials provider + bcrypt + DB stay in `lib/auth.ts` (Node-only).

**Acceptance:** unauthenticated requests redirect to `/login`. Wrong password fails with a calm specific error. Correct password lands on `/` and the session cookie persists across reloads. After 5 failures from one IP, return a `429` for 60 seconds.

## Phase 4: Setup wizard ✅

**Goal:** first login lands on a 3-step setup that captures API key, voice profile, and post corpus.

- [x] Create `app/setup/page.tsx` and supporting components per design Section 2.
- [x] Step 1 — Connect a model: provider select + API key password input. On "Test and continue", make a single test request to the provider. If it succeeds, encrypt the key (use `@/lib/crypto.ts` — write a small wrapper around Node's `crypto` AES-GCM with a key derived from `AUTH_PASSWORD`) and store it in `config.encrypted_api_key`.
- [x] Step 2 — Voice profile: mono textarea (~280px), prefilled with a starter markdown profile. On Continue, save to `voice_profile.markdown`.
- [x] Step 3 — Post corpus: mono textarea expecting JSON. Detect counts and date range live as the user types. On Finish setup, parse the JSON, validate with Zod, bulk-insert into `posts`, set `config.setup_completed_at`.
- [x] Add server-side guard: if `setup_completed_at` is null and the user is authenticated, redirect them from `/` to `/setup`. Once setup is complete, `/setup` redirects to `/`.
- [x] Each step has Skip / Back / Continue per design. Skipped steps can be completed later from Settings.

**Acceptance:** fresh deploy → login → wizard → 3 steps → workspace. Each step's data persists. Mid-wizard reload returns to the same step.

Resume behavior: a visit to `/setup` (no `?step=` hint) derives the next-needed step from server state and redirects to `/setup?step=N`. Resolves my open question 6 from the kickoff summary.

## Phase 5: UI primitives ✅ (built before Phase 4 by design judgment, so the wizard composes them)

**Goal:** the component library from `design/primitives.html` exists as React components.

- [x] Create `components/ui/button.tsx` with variants: `primary | secondary | ghost`, sizes: `sm | default | lg`. Streaming state: replaces label with `<dot-pulse> + label`, disabled.
- [x] `components/ui/input.tsx`: text, password, select variants. Border `border-strong` at rest, `accent` on focus with `accent-soft` 3px ring. Use `:focus-visible`, not `:focus`. (`select` lives in `components/ui/select.tsx` as a sibling for clarity.)
- [x] `components/ui/textarea.tsx`: prose and mono variants. Mono uses JetBrains Mono 13/21.
- [x] `components/ui/card.tsx`: static and interactive. Interactive lifts border on hover, no shadow, no transform.
- [x] `components/ui/label.tsx`: 13/20 medium, optional hint slot.
- [x] `components/ui/page-header.tsx`, `components/ui/section-header.tsx` (both exported from `components/ui/page-header.tsx`).
- [x] `components/ui/badge.tsx`: variants neutral/success/danger/accent. 24px high, 4px radius, paired 6px colored dot.
- [x] `components/output/output-block.tsx`: live/done/fail states. Sits on `sunken` surface. Pulsing dot, blinking caret per design.
- [x] `components/output/post-block.tsx`: serif rendering of `<post>` tags, 3px terracotta left border, mono meta line.
- [x] Ported the full primitive + layout CSS from `design/screens.css` into `app/globals.css` so one source of truth drives styling; React components are thin wrappers that pass class names through.

**Acceptance:** open a `/dev/primitives` route (or storybook-style page) showing every primitive in both modes, matching `design/primitives.html`.

## Phase 6: Workspace (home + sidebar)

**Goal:** the workspace screen matches the design in both empty and populated states.

- [ ] Create `components/workspace/sidebar.tsx`: 220px fixed-width nav with links to the four actions (`Draft`, `Ideate`, `Search`, `Quality check`), each with its `⌘1`–`⌘4` mono hint, plus a Settings link at the bottom. Brand mark at top.
- [ ] Update `app/page.tsx`: page header with mono eyebrow "Workspace", h1 "What are you writing today?", right-side badges showing post count + voice profile status.
- [ ] Action cards: 2×2 grid below the header. Each card has the action title (17px), one-line description, mono `⌘N` shortcut top-right. Use the interactive card variant.
- [ ] Empty state footer: "Nothing here yet. Your drafts and checks will show up below once you run one."
- [ ] Populated state: add a "Recent" section header below the cards with `View all` ghost button. List rows: `[when] [title] [kind]` separated by hairlines. Kind rendered as mono uppercase faint.
- [ ] Keyboard shortcuts: `⌘1`–`⌘4` navigate to the action pages. Implement at the layout level so they work from any screen.

**Acceptance:** match `design/screens.html` sections 3 and 4 in both modes. Keyboard shortcuts work from any page.

## Phase 7: Action views

**Goal:** the four action pages exist with idle, streaming, and complete states.

- [ ] `app/draft/page.tsx` per design Section 5. Topic textarea (96px idle, 72px streaming), output block below with placeholder dashed border when empty, fully working streaming, post block rendering when output contains `<post>` tags.
- [ ] `app/ideate/page.tsx` per Section 6. Rough idea textarea, primary "Five angles", output is a numbered list with `Draft this` secondary-sm per angle that deep-links to `/draft?topic=...`.
- [ ] `app/search/page.tsx` per Section 7. Single-line `input--lg` query, output is a list of post cards (date + score in mono, excerpt in Source Serif).
- [ ] `app/quality-check/page.tsx` per Section 8. Larger paste textarea (~140px), output is findings rendered as cards with mono index, issue title, optional excerpt with left rule, and a fix paragraph.
- [ ] `⌘↵` submits the active form. `Esc` cancels a streaming request.
- [ ] All four actions hit `/api/generate` with the same body shape (action + payload).
- [ ] Update `app/api/generate/route.ts` to remove `apiKey` from the request body. Fetch it server-side from `config.encrypted_api_key`, decrypt, use, never echo.

**Acceptance:** all four actions stream cleanly. No layout shift on first token. Errors render per the "Output failed" pattern (danger dot, status code, partial output preserved, Try again button).

## Phase 8: Settings page

**Goal:** Settings matches design Section 9 with four cards and working save actions.

- [ ] `app/settings/page.tsx` with four cards: Provider & API key, Voice profile, Post corpus, Backup & restore.
- [ ] Provider card: two-column grid (provider select + API key password input). `Test connection` runs a real test request. `Last verified` updates on success.
- [ ] Voice profile card: mono textarea (180px) editing the markdown. Footer shows `Nlines · NKB` left, Revert + Save right.
- [ ] Post corpus card: stats strip on sunken surface (POSTS · 47, RANGE, INDEXED). Re-index, Replace corpus, Add posts buttons.
- [ ] Backup & restore card: Restore from file + Download backup secondary buttons. Download exports a JSON of voice profile + posts (no API key).

**Acceptance:** match `design/screens.html` Section 9. Each card saves independently. `Last saved Nm ago` badge updates on any save.

## Phase 9: States and polish

**Goal:** every edge case has a designed treatment.

- [ ] Inline banner component for global notifications (e.g., 401 from provider). Per design Section 10.
- [ ] Mobile responsive: sidebar collapses to a `Menu` button under 768px. Page headers wrap. Action cards stack.
- [ ] Accessibility audit: tab order, focus rings, screen reader testing on the output block live region.
- [ ] Loading states for non-streaming reads (Settings load, Search). Use subtle fade-ins, no spinners.
- [ ] 404 and error.tsx pages per the same design language.

**Acceptance:** every screen passes a mobile responsive check at 375px and 768px. Pa11y or axe shows no critical accessibility issues.

## Phase 10: Deploy story

**Goal:** the "Deploy with Vercel" button works and a non-technical user can get from clicking to a running instance in under 10 minutes.

- [ ] `vercel.json` configured for the Postgres integration auto-attach.
- [ ] `.env.example` documents all env vars with comments explaining each.
- [ ] Rewrite `README.md` for the public repo: project description, the deploy button, the setup flow with screenshots (placeholder text where screenshots will go), the architecture summary, links to DESIGN.md and the B1 companion repo.
- [ ] Deploy button URL: construct per Vercel docs with the right env var prompts and the Postgres integration.
- [ ] Test the full flow yourself: fork the repo, click the deploy button on a test account, walk through setup, draft a post.

**Acceptance:** a fresh deploy works end to end. Time from clicking the button to having a draft generated: under 10 minutes.

## Open questions to surface as you work

- Where to store the encrypted API key encryption key — derived from `AUTH_PASSWORD` is the current plan, but verify this survives password rotation (it doesn't; document this and have the user re-enter their API key after rotating).
- Rate limit storage: in-memory is fine for v1 since each instance is single-user, but consider Vercel KV if abuse becomes a concern.
- The "Test connection" action in Settings: which Anthropic endpoint to use as the lightest possible test request? (probably a single short `messages.create` with a tiny prompt and `max_tokens: 1`).
- The setup wizard's voice profile starter content: should it be a literal template that says "fill these blanks", or an example filled-in profile to demonstrate the shape? Decision needed before Phase 4.

## Definition of done for the whole project

When all 10 phases are checked:
1. Click "Deploy with Vercel" from the repo README → working instance in under 10 minutes for a non-technical user.
2. The four actions stream cleanly with the designed visual language.
3. All screens match `design/screens.html` in both light and dark mode at desktop and mobile breakpoints.
4. The code is clean enough that a senior engineer browsing the repo thinks "I'd contribute to this."
5. The README's deploy button has been used at least once successfully by someone other than the maintainer.
