# DESIGN.md

A short rationale for how Content Coach looks. This document is intentionally part of the repo, not a marketing artifact: if you fork this project, these are the choices you should keep or replace deliberately.

## What we were trying to make

A tool that reads as serious writing software, not as another AI wrapper. The audience is a senior operator scanning the GitHub repo between meetings. They have already seen the gradient-orb-and-sparkle aesthetic ten times this quarter. They are looking for evidence that someone thought about the work, not the launch.

So the brief was simple: closer to iA Writer, Substack's writer dashboard, or Linear's settings pages than to a Notion AI sidebar. A private workshop, not a public stage.

## The aesthetic in three moves

**Warm paper, not white.** Backgrounds sit at oklch 0.985 with a chroma of 0.005 in the warm-hue range. The warmth reads. The chroma is too low to register as a color, so the page feels like good paper instead of like a beige product. Dark mode is the same hue at oklch 0.185, a deep warm slate. Never flat black. Both modes share the same five surface tones (sunken, bg, surface, subtle, border, border-strong) so cards lift through material, not through shadows.

**One accent, used like ink.** A single warm terracotta carries every primary CTA, every focus ring, and the left rule on the rendered post block. That is its full vocabulary. There is no secondary accent, no gradient, no glow, no second hue for "info." When every interactive moment uses the same color, the page feels composed. When a button needs to disappear into the page, ghost variants do that on their own without inventing more color.

**Two type registers, one editorial moment.** Inter for everything UI, Source Serif 4 reserved for the rendered post block, JetBrains Mono for JSON, voice profile markdown, and the small metadata strings (token counts, timestamps, keyboard shortcuts). The serif is what tells you the artifact in front of you is the thing you would publish, not chat output. Reserving it for one element per screen keeps it readable as a signal.

## Choices worth defending

Borders over fills. Hairlines define cards and inputs at rest; the strong border picks up on focus and on dividers between sections. Backgrounds fill only when hierarchy demands it (the output block sits on the sunken surface so the eye knows the model wrote that, not the user).

No icons in primary navigation. Words are clearer. Words also keep the page from looking like a SaaS launchpad.

Content stays narrow. 720 to 880px max, even on a 27-inch display. The app should never fill the screen edge-to-edge. A writer's tool reads in a column.

No skeleton loaders, no jumbo spinners. Streaming shows as a single pulsing 7px terracotta dot in the output block, with a one-block caret on the live token. Errors are specific, not friendly-vague: "Anthropic returned a 529 after 142 tokens. Your draft so far is below." The partial output is preserved.

If you find yourself reaching for a sparkle, a gradient header, or a bright "Generate" CTA, stop. That is not what this tool is for.
