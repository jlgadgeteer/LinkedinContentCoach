# LinkedIn Content Coach

> Self-hosted, open-source LinkedIn writing tool. Deploy your own instance to Vercel, set a password, bring your own Claude or OpenAI key, and write in your own voice. Your data, your compute, your control.

## What it is

Four discrete actions, no chat:

- **Draft** a post in your voice from a topic.
- **Ideate** five angles when you're stuck.
- **Search** your past posts before writing something redundant.
- **Quality check** a draft for AI tells, voice drift, and weak openings.

The product IP is the voice profile (your style rules in markdown) and the skill prompts (`lib/prompts/`). Read them, fork them, tune them. The app is the orchestration layer around them.

## Deploy your own

The whole point of this repo is that you run it yourself. Clicking the button below forks the repo into your GitHub, provisions a Vercel project with a Postgres database, and asks for two environment variables.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fcontent-coach&project-name=content-coach&repository-name=content-coach&env=AUTH_PASSWORD,AUTH_SECRET&envDescription=AUTH_PASSWORD%20is%20the%20single%20password%20you%27ll%20use%20to%20sign%20in%20%2812%2B%20characters%29.%20AUTH_SECRET%20signs%20your%20session%20cookies%20%28run%20%60openssl%20rand%20-base64%2032%60%29.&envLink=https%3A%2F%2Fgithub.com%2Fyour-org%2Fcontent-coach%23environment-variables&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)

After the button:

1. Vercel asks for `AUTH_PASSWORD` and `AUTH_SECRET`. Set both. `AUTH_PASSWORD` is what you'll use to log in, 12 characters minimum. `AUTH_SECRET` is any random 32+ character string (`openssl rand -base64 32`).
2. Vercel attaches the Postgres integration. `POSTGRES_URL` is set automatically.
3. The first deploy boots and runs `CREATE TABLE IF NOT EXISTS` for the four tables.
4. Visit your new URL, enter your `AUTH_PASSWORD`, walk through the 3-step setup wizard (provider key, voice profile, post history), and start writing.

Estimated time: under 10 minutes for someone who has never used Vercel before.

## Environment variables

| Name | Required | What |
| --- | --- | --- |
| `AUTH_PASSWORD` | yes | Single login password (12+ characters). Set once at deploy. Rotating this invalidates your stored LLM API key on purpose; you'll be asked to re-enter it after the rotation. |
| `AUTH_SECRET` | yes | Signs JWT session cookies. Any random 32+ character string. |
| `POSTGRES_URL` | yes | Auto-set by the Vercel Postgres integration. For local dev, point this at a local Postgres or a Vercel branch URL. |
| `ANTHROPIC_API_KEY` | no | Optional pre-fill for the setup wizard. Most users skip this and enter the key in the UI where it's encrypted at rest. |
| `OPENAI_API_KEY` | no | Same as above for OpenAI. |

A working template lives in `.env.example`.

## Local development

```bash
npm install
cp .env.example .env.local            # then fill in AUTH_PASSWORD, AUTH_SECRET, POSTGRES_URL
npm run dev                           # http://localhost:3000
```

`npm run type-check` and `npm run lint` run TypeScript and Next.js linting. `npm run build` runs both as part of the production build.

If you don't want to wire up Postgres yet, the app boots without it; you'll see "Database not configured" instead of the workspace.

## Forgot password / reset

There is no email-based reset. Update `AUTH_PASSWORD` in your Vercel project's Environment Variables and redeploy. Note: rotating `AUTH_PASSWORD` makes the stored, encrypted LLM API key undecryptable (ADR-008). After a reset, the setup flow will prompt you to re-enter your key.

## Stack

- Next.js 15 (App Router) + React 19, TypeScript 5
- Tailwind CSS v4 with a CSS-based `@theme` block (no `tailwind.config.ts`)
- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- Drizzle ORM + `@vercel/postgres` (Neon-backed)
- Auth.js v5 (`next-auth@beta`) with credentials provider + JWT sessions
- `bcryptjs` for password hashing, Web Crypto for AES-GCM key encryption
- Zero shadcn/ui. Hand-rolled primitives in `components/ui/`.

## Architecture

Single-tenant by design. Each user deploys their own instance. The full set of architectural decisions, including the alternatives that were considered and rejected, lives in `docs/ARCHITECTURE.md`.

Design rationale (why warm paper, why no icons in nav, why a 7px terracotta pulsing dot instead of a spinner): `DESIGN.md`.

Operational brief for contributors: `CLAUDE.md`.

## License

MIT.
