export type ParsedIdea = {
  hook: string;
  angle: string;
  whyNow: string;
};

const IDEA_BLOCK = /<idea>([\s\S]*?)<\/idea>/gi;

function pickLine(block: string, prefix: string): string {
  const re = new RegExp(`^\\s*${prefix}\\s*:\\s*(.+)$`, "im");
  const m = block.match(re);
  return m ? m[1]!.trim() : "";
}

/**
 * Parse the ideate stream output into structured ideas. Falls back to an
 * empty array if the model didn't follow the <idea> contract; the caller
 * can detect that and render the raw text instead.
 */
export function parseIdeas(text: string): ParsedIdea[] {
  const out: ParsedIdea[] = [];
  let match: RegExpExecArray | null;
  while ((match = IDEA_BLOCK.exec(text)) !== null) {
    const inner = match[1] ?? "";
    const hook = pickLine(inner, "Hook");
    const angle = pickLine(inner, "Angle");
    const whyNow = pickLine(inner, "Why now");
    if (hook || angle) {
      out.push({ hook, angle, whyNow });
    }
  }
  return out;
}
