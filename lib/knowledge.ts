import "server-only";
import { sql } from "@vercel/postgres";

export async function getKnowledgeMarkdown(): Promise<string> {
  const res = await sql<{ markdown: string }>`
    SELECT markdown FROM knowledge_profile WHERE id = 1 LIMIT 1
  `;
  return res.rows[0]?.markdown ?? "";
}

export async function setKnowledgeMarkdown(markdown: string): Promise<void> {
  await sql`
    INSERT INTO knowledge_profile (id, markdown, updated_at)
    VALUES (1, ${markdown}, now())
    ON CONFLICT (id) DO UPDATE
      SET markdown = EXCLUDED.markdown, updated_at = now()
  `;
}
