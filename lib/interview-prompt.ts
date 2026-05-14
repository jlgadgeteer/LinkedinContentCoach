import "server-only";
import {
  DIMENSIONS,
  DIMENSION_LABEL,
  DIMENSION_PROMPT,
  type Dimension,
  type QaRow,
} from "@/lib/interview";

export type ParsedQuestion = {
  question: string;
  dimension: Dimension | null;
};

export function parseQuestion(text: string): ParsedQuestion {
  const tagMatch = text.match(/<question(?:\s+dimension="([a-z_]+)")?\s*>([\s\S]*?)<\/question>/i);
  if (tagMatch) {
    const dim = tagMatch[1] && (DIMENSIONS as readonly string[]).includes(tagMatch[1])
      ? (tagMatch[1] as Dimension)
      : null;
    return { question: tagMatch[2]!.trim(), dimension: dim };
  }
  // Fallback: model emitted plain text. Use it as the question.
  const cleaned = text.trim().replace(/^["“”]+|["“”]+$/g, "");
  return { question: cleaned, dimension: null };
}

export function buildQuestionUserMessage(args: {
  qa: QaRow[];
  coverage: Record<Dimension, number>;
  preferredDimension: Dimension;
  voiceProfile: string;
  knowledge: string;
  isFirstSession: boolean;
}): string {
  const priorBlock = args.qa.length === 0
    ? "(This is the first question of the session. Open with a warm but direct question that establishes context. Keep the bar high; this is a senior professional.)"
    : args.qa
        .filter((q) => q.answer)
        .map((q, i) => {
          const dim = q.dimension ? ` [${DIMENSION_LABEL[q.dimension]}]` : "";
          return `Q${i + 1}${dim}: ${q.question}\nA${i + 1}: ${q.answer}`;
        })
        .join("\n\n");

  const covLines = DIMENSIONS.map((d) => `- ${DIMENSION_LABEL[d]} (${d}): ${args.coverage[d]} answer(s)`).join("\n");
  const dimGuide = `Bias toward dimension "${args.preferredDimension}" (${DIMENSION_PROMPT[args.preferredDimension]}) unless the prior answer opens a stronger thread in another dimension.`;

  const voiceBlock = args.voiceProfile.trim() || "(no existing voice profile)";
  const knowledgeBlock = args.knowledge.trim() || "(no existing knowledge profile)";

  const sessionContext = args.isFirstSession
    ? "First-session note: aim for breadth across all six dimensions before depth. Don't dig into one dimension for more than 2-3 questions in a row."
    : "Refresh-session note: deprioritize dimensions already well-covered in the existing knowledge profile. Bias toward what's new since last session.";

  return [
    "## Existing voice profile",
    "",
    voiceBlock,
    "",
    "## Existing knowledge profile",
    "",
    knowledgeBlock,
    "",
    "## Coverage so far this session",
    "",
    covLines,
    "",
    dimGuide,
    "",
    sessionContext,
    "",
    "## Prior Q&A this session",
    "",
    priorBlock,
    "",
    "Generate the next question now. Output ONLY the <question> tag.",
  ].join("\n");
}

export function buildSynthesisUserMessage(args: {
  qa: QaRow[];
  voiceProfile: string;
  knowledge: string;
}): string {
  const qaBlock = args.qa
    .filter((q) => q.answer)
    .map((q, i) => {
      const dim = q.dimension ? ` [${DIMENSION_LABEL[q.dimension]}]` : "";
      return `### Q${i + 1}${dim}\n${q.question}\n\n**A${i + 1}:** ${q.answer}`;
    })
    .join("\n\n");

  const voiceBlock = args.voiceProfile.trim() || "(no existing voice profile)";
  const knowledgeBlock = args.knowledge.trim() || "(no existing knowledge profile)";

  return [
    "## Existing voice profile",
    "",
    voiceBlock,
    "",
    "## Existing knowledge profile",
    "",
    knowledgeBlock,
    "",
    "## This session's Q&A",
    "",
    qaBlock,
    "",
    "Now produce <summary>, <voice>, and <knowledge> blocks per the skill rules.",
  ].join("\n");
}

export function parseSynthesis(text: string): {
  summary: string;
  voice: string;
  knowledge: string;
} {
  function pick(tag: string): string {
    const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = text.match(re);
    return m ? m[1]!.trim() : "";
  }
  return {
    summary: pick("summary"),
    voice: pick("voice"),
    knowledge: pick("knowledge"),
  };
}
