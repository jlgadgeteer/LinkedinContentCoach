// Prompt assembler. Builds the final messages array for the LLM based on the
// requested action, the user's voice profile, their post corpus, and the input.

import type { Action, Post } from "../types";
import {
  DRAFT_SKILL,
  IDEATE_SKILL,
  SEARCH_SKILL,
  CHECK_SKILL,
  REVISE_SKILL,
} from "./skills";

const SYSTEM_BASE = `You are this creator's LinkedIn content coach. You help them turn ideas into posts that sound like them, not like an LLM. The voice profile and post history below are authoritative.

Core operating rules:

- Never announce tool usage. Don't say "let me search your posts." Just do the work.
- Direct, peer voice. They are senior. Skip over-explaining and disclaimers. Push back when their thinking is off.
- The voice profile wins over your defaults. When the user contradicts the voice profile in chat, follow the user.
- Don't say "as an AI" or apologize for being an LLM.`;

function skillFor(action: Action): string {
  switch (action) {
    case "draft":
      return DRAFT_SKILL;
    case "ideate":
      return IDEATE_SKILL;
    case "search":
      return SEARCH_SKILL;
    case "check":
      return CHECK_SKILL;
    case "revise":
      return REVISE_SKILL;
  }
}

function formatPostCorpus(posts: Post[], limit = 30): string {
  if (posts.length === 0) {
    return "(No post history loaded. The creator has not yet imported their LinkedIn posts.)";
  }
  // Take the most recent N posts. For larger corpora this should be smarter
  // (top performers + recent), but for v1 recency is fine.
  const slice = posts.slice(0, limit);
  const formatted = slice.map((p, i) => {
    const stats: string[] = [];
    if (p.reactions > 0) stats.push(`${p.reactions} reactions`);
    if (p.comments > 0) stats.push(`${p.comments} comments`);
    if (p.reposts > 0) stats.push(`${p.reposts} reposts`);
    const statsLine = stats.length > 0 ? `\n**Engagement:** ${stats.join(", ")}` : "";
    return `### Post ${i + 1}\n**Date:** ${p.date}\n**Hook:** ${p.hook}${statsLine}\n${p.url ? `**URL:** ${p.url}\n` : ""}\n${p.text}`;
  });
  const note = posts.length > limit ? `\n\n(${posts.length - limit} additional older posts available but not shown for brevity.)` : "";
  return formatted.join("\n\n---\n\n") + note;
}

export function buildSystemPrompt(args: {
  action: Action;
  voiceProfile: string;
  posts: Post[];
  knowledge?: string;
  qualityRules?: string;
  writingMode?: { name: string; markdown: string } | null;
}): string {
  const voiceBlock = args.voiceProfile.trim().length > 0
    ? args.voiceProfile.trim()
    : "(No voice profile loaded. Use sensible LinkedIn defaults and ask the creator to fill in their voice profile in Settings.)";

  const knowledgeBlock = args.knowledge && args.knowledge.trim().length > 0
    ? args.knowledge.trim()
    : null;

  const sections: string[] = [
    SYSTEM_BASE,
    "",
    "## Skill: " + args.action,
    "",
    skillFor(args.action),
    "",
    "## Voice profile",
    "",
    voiceBlock,
  ];

  if (knowledgeBlock) {
    sections.push(
      "",
      "## Knowledge profile",
      "",
      "These are the topics this creator owns, the opinions they hold, and the audience they write for. Treat as authoritative for what to write about; voice profile remains authoritative for how.",
      "",
      knowledgeBlock,
    );
  }

  // Inject the user's editable quality rules into both Draft (so the model
  // avoids these patterns up front) and Check (so it grades against them).
  // Skip for Ideate / Search where the rules don't apply.
  if (
    (args.action === "draft" || args.action === "check") &&
    args.qualityRules &&
    args.qualityRules.trim().length > 0
  ) {
    sections.push(
      "",
      "## Quality rules",
      "",
      "These are user-editable. They override your defaults. Treat as authoritative for what to avoid (Draft) or grade against (Check).",
      "",
      args.qualityRules.trim(),
    );
  }

  if (args.action === "draft" && args.writingMode && args.writingMode.markdown.trim().length > 0) {
    sections.push(
      "",
      "## Writing mode: " + args.writingMode.name,
      "",
      "The user picked this mode for this draft. Apply it on top of the voice profile; the mode wins on structural and stylistic choices that conflict.",
      "",
      args.writingMode.markdown.trim(),
    );
  }

  sections.push("", "## Post corpus", "", formatPostCorpus(args.posts));
  return sections.join("\n");
}

export function buildUserMessage(args: {
  action: Action;
  topic?: string;
  draft?: string;
  query?: string;
  original?: string;
  instruction?: string;
}): string {
  switch (args.action) {
    case "draft":
      return args.topic
        ? `Draft a post about: ${args.topic}`
        : "Draft a LinkedIn post. The user didn't specify a topic; ask one short clarifying question.";
    case "ideate":
      return args.topic
        ? `Give me 3 to 5 post ideas, with this focus area in mind: ${args.topic}`
        : "Give me 3 to 5 post ideas for this week, based on my themes and recent posts.";
    case "search":
      return args.query
        ? `Search my past posts for: ${args.query}`
        : "Show me my most recent posts.";
    case "check":
      return `Run a quality check on this draft and return findings with specific fixes:\n\n${args.draft ?? "(no draft provided)"}`;
    case "revise":
      return [
        "Here is the existing draft:",
        "",
        args.original ?? "(no draft provided)",
        "",
        "Apply this revision:",
        "",
        args.instruction ?? "(no instruction provided)",
      ].join("\n");
  }
}
