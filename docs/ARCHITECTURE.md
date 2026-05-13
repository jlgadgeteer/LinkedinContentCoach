# Architecture decisions

A reference of the consequential technical choices and the reasoning behind each. When in doubt, this file is the tiebreaker.

## ADR-001: Self-deploy, single-tenant, not multi-tenant SaaS

**Decision:** Each user deploys their own Vercel instance with their own database.

**Rejected alternatives:** Central multi-tenant SaaS. IndexedDB-only local storage.

**Why:** Multi-tenant SaaS introduces operational burden, privacy concerns (hosting strangers' data), and weakens the "configuration as product" positioning. IndexedDB-only was tried in v1 but failed the cross-device requirement. Self-deploy single-tenant is the sweet spot: cross-device works through the user's own Postgres, but we never run anything centrally.

**Consequence:** Every user must complete a one-time Vercel deploy. The README and setup flow must make this trivial for non-technical users.

## ADR-002: Single password auth, set at deploy time

**Decision:** Auth is one password, set via `AUTH_PASSWORD` env var at Vercel deploy.

**Rejected alternatives:** Google OAuth, Microsoft OAuth, magic-link email, GitHub OAuth.

**Why:** OAuth providers require the deploying user to navigate Google Cloud Console, Azure AD, or GitHub Developer Settings to create an OAuth app. For non-technical users this is the deploy-flow cliff. Magic-link email requires signing up for a separate email service (Resend, etc.). Single password works for 100% of deployers with one env var, matching the standard pattern for every self-hosted tool (Plex, Vaultwarden, Home Assistant, every CMS).

**Consequence:** The login screen design must make single-password feel intentional, not rudimentary. The setup README must explain how to set a strong password and how to reset it (update env var, redeploy).

**Mitigation for weak passwords:** Enforce 12-character minimum at first-time setup, rate-limit failed attempts (5/min/IP), document the risk in the deploy guide.

## ADR-003: Vercel Postgres (Neon) for storage

**Decision:** Storage is Postgres via Vercel's marketplace Neon integration.

**Rejected alternatives:** Vercel KV, Vercel Blob, Turso, Supabase (separate signup), SQLite via Turso.

**Why:** Vercel Postgres is one-click-installable during the deploy flow. Free tier is plenty for a single-user instance. The Postgres SQL surface is familiar and well-supported by Drizzle. Vercel KV is too limited for relational data. External services (Supabase, Turso) require separate account creation, which violates the "few clicks" deploy goal.

**Consequence:** All persistent state lives in Postgres. No IndexedDB, no LocalStorage for anything other than UI preferences. Schema migrations use idempotent `CREATE TABLE IF NOT EXISTS` on boot for v1 simplicity.

## ADR-004: Drizzle ORM over Prisma or raw SQL

**Decision:** Drizzle for the data layer.

**Rejected alternatives:** Prisma, raw `@vercel/postgres` queries.

**Why:** Drizzle is lightweight (no code generation step, fully type-safe via TypeScript). Prisma adds a separate generation step and a heavier runtime. Raw SQL loses type safety and makes refactoring slow. For a project where the schema fits in one file, Drizzle is the right size.

**Consequence:** `lib/db/schema.ts` is the single source of truth for schema. Schema changes happen in TypeScript, not SQL files.

## ADR-005: Vercel AI SDK over LangChain or direct SDK calls

**Decision:** Use `ai` + `@ai-sdk/anthropic` + `@ai-sdk/openai` for the LLM layer.

**Rejected alternatives:** Direct Anthropic SDK + direct OpenAI SDK, LangChain, custom abstraction.

**Why:** Vercel AI SDK provides a unified streaming interface across providers, ergonomic edge-runtime support, and stable type contracts. LangChain is too heavy and opinionated for a single-flow product. Direct SDKs would require us to write provider-switching logic that the AI SDK already provides.

**Consequence:** Adding a new provider (Gemini, Mistral, Ollama) is a one-file change in `lib/llm.ts`.

## ADR-006: Edge runtime for streaming, Node runtime for auth

**Decision:** `app/api/generate/route.ts` uses `runtime = "edge"`. Auth handlers and bcrypt calls stay on Node runtime.

**Why:** Edge runtime gives lower-latency streaming and better cold-start characteristics for the LLM relay. Node runtime is required for `bcryptjs` and for some Auth.js v5 internals.

**Consequence:** Routes have explicit `export const runtime = ...` declarations. Don't accidentally import Node-only libraries into edge routes.

## ADR-007: Action-oriented UI over chat

**Decision:** The workspace has four discrete action surfaces (Draft, Ideate, Search, QC), not a unified chat interface.

**Rejected alternatives:** A single chat box with `/commands`. A chat-with-skills-as-tools pattern (Stanley's approach).

**Why:** Chat interfaces invite open-ended conversation, which produces unpredictable output quality. Discrete action surfaces let us tune prompts, UI, and output format per task. They also make the product easier to demo and reason about. The differentiation from Stanley (which is chat + tools) is intentional.

**Consequence:** Each action lives at its own URL (`/draft`, `/ideate`, `/search`, `/quality-check`) with its own input and output components. No global chat thread state.

## ADR-008: Encrypted API key storage

**Decision:** The user's LLM API key is encrypted at rest in `config.encrypted_api_key` using AES-GCM with a key derived from `AUTH_PASSWORD` via PBKDF2.

**Rejected alternatives:** Storing the key as plaintext, storing it only client-side, asking the user to enter it on every request.

**Why:** Plaintext-at-rest fails basic security expectations. Client-side-only doesn't work cross-device. Per-request entry is hostile UX. Key-derived encryption ties the API key's confidentiality to the user's password — if the database is compromised but the password isn't, the key stays encrypted.

**Consequence:** When the user changes `AUTH_PASSWORD` via env var (i.e., password rotation), the existing encrypted key becomes undecryptable. This must be documented; the user re-enters their API key after rotation.

## ADR-009: No image assets, no icons in primary navigation

**Decision:** The UI uses no decorative icons in primary navigation, no images other than provider logos in the model picker, and no SVG illustrations.

**Why:** Words are clearer than glyphs. Decorative imagery signals SaaS marketing, not writer's tool. The aesthetic restraint is the differentiation.

**Consequence:** When tempted to add an icon (notification bell, sparkle next to "Generate", little graph in the sidebar), don't. Per design brief and `CLAUDE.md`.

## ADR-010: No skeleton loaders, no jumbo spinners

**Decision:** Loading states use subtle indicators only. Streaming uses a single 7px pulsing terracotta dot.

**Why:** Skeleton loaders and spinners are SaaS chrome that signal "generic AI tool." A pulsing dot says "something is happening" without theatrics. Restraint reinforces the writer's-tool aesthetic.

**Consequence:** Don't reach for `react-loading-skeleton` or similar. Plain CSS animations on a single dot suffice.
