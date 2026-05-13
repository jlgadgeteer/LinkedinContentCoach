# Background: the B1 companion project

This document gives Claude Code historical context on how this project came to be. It is not required reading for day-to-day work, but it explains the design and architectural choices.

## The story

The project started as an attempt to replace a $150/month LinkedIn writing tool (Stanley). A weekend's exploration produced two artifacts:

**B1: a Claude Skills + Project Pack.** Five markdown files and one tiny Python script. Users drop their LinkedIn data export into a Claude Project, customize a voice profile, and have a working content coach inside Claude.ai. Lives in a separate repo at [github.com/.../linkedin-content-coach-skills].

**B2: this project.** The same intelligence layer (voice profile + four skill prompts), exposed as a self-hosted web app. Same skills, different orchestration. The B2 product targets users who:
- Want a tool that works across devices
- Don't use Claude.ai Projects daily
- Want a polished UI rather than a configured chat surface

The B1/B2 split is intentional. B1 demonstrates the "configuration as product" thesis. B2 is the engineered companion that puts the same configuration behind a designed product surface.

## What carries over from B1 to B2

- **The four skill prompts.** Translated from B1's markdown files into TypeScript modules at `lib/prompts/skills.ts`. The content is essentially identical.
- **The voice profile concept.** B1 stores it as a markdown file in a Claude Project. B2 stores it as a markdown string in Postgres, edited via the Settings UI.
- **The post corpus concept.** B1 uses a markdown file generated from a Python parser. B2 uses a Postgres table populated via paste-JSON in the setup wizard.

## What's new in B2

- Hosted product surface with auth
- Cross-device access via single-tenant Postgres
- "Deploy with Vercel" one-click setup for non-technical users
- The designed visual language (see `design/`)

## The "configuration as product" thesis

A recurring theme worth understanding. The argument is that most LLM-powered tools are 90% prompt and 10% scaffolding, but they're shipped as if the proportions were reversed. By making the prompts explicit, readable, and forkable, you:

1. Lower the barrier to customization (anyone can edit a markdown file)
2. Make the actual IP auditable (you can read what the tool will tell the model)
3. Reduce the cost of going from "for me" to "for everyone" to near zero (the artifact is configuration, not code)

The B2 implementation should reinforce this thesis. The skills stay readable, the voice profile stays editable, and the architecture stays simple enough that a forker can understand the whole thing in an afternoon.
