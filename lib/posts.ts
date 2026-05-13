import { sql } from "@vercel/postgres";
import type { Post } from "./types";

/**
 * Pulls the most recent posts from the DB, shaped for the prompt assembler.
 * Edge-safe via @vercel/postgres HTTP transport.
 */
export async function getPostsForPrompt(limit = 30): Promise<Post[]> {
  const res = await sql<{
    id: string;
    published_at: string | null;
    url: string | null;
    hook: string | null;
    text: string;
    word_count: number;
    created_at: string;
  }>`
    SELECT id, published_at::text, url, hook, text, word_count, created_at::text
    FROM posts
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `;

  return res.rows.map((r) => ({
    id: r.id,
    date: r.published_at ? r.published_at.slice(0, 10) : "",
    url: r.url ?? "",
    hook: r.hook ?? "",
    text: r.text,
    wordCount: r.word_count,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function getVoiceProfileMarkdown(): Promise<string> {
  const res = await sql<{ markdown: string }>`SELECT markdown FROM voice_profile WHERE id = 1 LIMIT 1`;
  return res.rows[0]?.markdown ?? "";
}
