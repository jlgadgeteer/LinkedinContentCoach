import "server-only";
import { sql } from "@vercel/postgres";
import { isMissingRelationOrColumn } from "@/lib/db/safe-query";

export async function getKnowledgeMarkdown(): Promise<string> {
  try {
    const res = await sql<{ markdown: string }>`
      SELECT markdown FROM knowledge_profile WHERE id = 1 LIMIT 1
    `;
    return res.rows[0]?.markdown ?? "";
  } catch (err) {
    if (isMissingRelationOrColumn(err)) {
      // eslint-disable-next-line no-console
      console.warn("[content-coach] knowledge_profile missing. Run /api/admin/migrate.");
      return "";
    }
    throw err;
  }
}

export async function setKnowledgeMarkdown(markdown: string): Promise<void> {
  await sql`
    INSERT INTO knowledge_profile (id, markdown, updated_at)
    VALUES (1, ${markdown}, now())
    ON CONFLICT (id) DO UPDATE
      SET markdown = EXCLUDED.markdown, updated_at = now()
  `;
}
