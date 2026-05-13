# LinkedIn Content Coach

> Self-hosted, open-source LinkedIn writing tool. Deploy your own instance to Vercel in a few clicks. Bring your own Claude or OpenAI API key. Your data, your compute, your control.

**Status:** in active development. This README will be polished in Phase 10 of `PLAN.md`. Do not link to it externally yet.

## What it does

Helps senior professionals draft LinkedIn posts in their own voice using four focused actions:

- **Draft** a post in your voice from a topic
- **Ideate** five angles when you're stuck
- **Search** your past posts before writing something redundant
- **Quality-check** a draft for AI tells and voice drift

The intelligence is in the voice profile (your style rules in markdown) and the skill prompts (in `lib/prompts/`). Read them, fork them, tune them. The app is the orchestration layer around them.

## Deploy your own

(Vercel deploy button + setup screenshots go here in Phase 10.)

## Architecture

Single-tenant by design. Each user deploys their own Vercel instance and stores their data in their own Postgres database. Single-password auth, set during deployment. No central service, no shared infrastructure, no signup.

See `DESIGN.md` for the design rationale and `CLAUDE.md` for the operational context.

## License

MIT.
