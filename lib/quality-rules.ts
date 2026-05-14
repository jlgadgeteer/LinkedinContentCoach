import "server-only";
import { sql } from "@vercel/postgres";
import { isMissingRelationOrColumn } from "@/lib/db/safe-query";

/**
 * The default quality-rules markdown shipped with the app. Used to seed the
 * quality_rules row on first read so the user has something to edit. Pulled
 * out of the CHECK skill prompt so it can evolve as data, not code.
 */
export const DEFAULT_QUALITY_RULES = `## Red flags (must fix)

These are AI tells. Every one is a fail.

**Punctuation and structure:**
- Em dashes (any em dash)
- Three-part parallel constructions ("It's not X. It's Y. It's Z.")
- Bolded phrases mid-sentence for emphasis
- Recap paragraphs at the end

**Openers:**
- "In today's fast-paced world..."
- "In the age of AI..."
- "Let's dive in..."
- "Here's the thing..."
- "The truth is..."
- "Make no mistake..."

**LinkedIn cliches:**
- Game-changer, synergy, leverage (as verb), deep dive, circle back, move the needle, unlock value, paradigm shift, North Star, 10x, low-hanging fruit, at the end of the day, drive outcomes, mission-critical

**AI-tell vocabulary:**
- Delve, myriad, tapestry, navigate (as verb), harness (as verb), robust (when "strong" would do), comprehensive (filler), seamless, cutting-edge, state-of-the-art, revolutionary

**Closing patterns:**
- "What are your thoughts?"
- "Let me know in the comments."
- "DM me if interested."
- "Follow for more."
- "I'm humbled..."

## Yellow flags (review)

- More than 2 emojis (default zero unless voice profile says otherwise).
- Any hashtag unless explicitly requested.
- Bullets in groups of exactly three.
- Sentences over 25 words.
- Paragraphs over 4 sentences.
- A "P.S." or "Bonus tip" section.
- Hook that takes more than 2 lines to land.
- "Not just X, but Y" construction.
`;

export async function getQualityRulesMarkdown(): Promise<string> {
  try {
    const res = await sql<{ markdown: string }>`
      SELECT markdown FROM quality_rules WHERE id = 1 LIMIT 1
    `;
    const md = res.rows[0]?.markdown;
    if (md && md.trim().length > 0) return md;
    // No row, or empty row. Seed once with the defaults so editing is friendly.
    await sql`
      INSERT INTO quality_rules (id, markdown, updated_at)
      VALUES (1, ${DEFAULT_QUALITY_RULES}, now())
      ON CONFLICT (id) DO UPDATE
        SET markdown = CASE WHEN length(quality_rules.markdown) = 0
                            THEN EXCLUDED.markdown
                            ELSE quality_rules.markdown END
    `;
    return DEFAULT_QUALITY_RULES;
  } catch (err) {
    if (isMissingRelationOrColumn(err)) {
      // eslint-disable-next-line no-console
      console.warn("[content-coach] quality_rules missing; falling back to defaults. Run /api/admin/migrate.");
      return DEFAULT_QUALITY_RULES;
    }
    throw err;
  }
}

export async function setQualityRulesMarkdown(markdown: string): Promise<void> {
  await sql`
    INSERT INTO quality_rules (id, markdown, updated_at)
    VALUES (1, ${markdown}, now())
    ON CONFLICT (id) DO UPDATE
      SET markdown = EXCLUDED.markdown, updated_at = now()
  `;
}
