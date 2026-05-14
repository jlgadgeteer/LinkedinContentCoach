import { sql } from "@vercel/postgres";
import type { Post } from "./types";

type PostRow = {
  id: string;
  published_at: string | null;
  url: string | null;
  hook: string | null;
  text: string;
  word_count: number;
  reactions: number;
  comments: number;
  likes: number;
  reposts: number;
  created_at: string;
};

function rowToPost(r: PostRow): Post {
  return {
    id: r.id,
    date: r.published_at ? r.published_at.slice(0, 10) : "",
    url: r.url ?? "",
    hook: r.hook ?? "",
    text: r.text,
    wordCount: r.word_count,
    reactions: r.reactions ?? 0,
    comments: r.comments ?? 0,
    likes: r.likes ?? 0,
    reposts: r.reposts ?? 0,
    createdAt: new Date(r.created_at).getTime(),
  };
}

/**
 * Pulls the most recent posts from the DB, shaped for the prompt assembler.
 * Edge-safe via @vercel/postgres HTTP transport.
 */
export async function getPostsForPrompt(limit = 30): Promise<Post[]> {
  const res = await sql<PostRow>`
    SELECT id, published_at::text, url, hook, text, word_count,
           reactions, comments, likes, reposts, created_at::text
    FROM posts
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `;
  return res.rows.map(rowToPost);
}

/**
 * Pulls top posts by reactions, used by voice extraction and the "best posts"
 * view. Falls back to recency for posts with zero engagement metadata.
 */
export async function getTopPostsByReactions(limit = 10): Promise<Post[]> {
  const res = await sql<PostRow>`
    SELECT id, published_at::text, url, hook, text, word_count,
           reactions, comments, likes, reposts, created_at::text
    FROM posts
    WHERE reactions > 0
    ORDER BY reactions DESC
    LIMIT ${limit}
  `;
  return res.rows.map(rowToPost);
}

export async function getRecentPosts(limit = 10): Promise<Post[]> {
  const res = await sql<PostRow>`
    SELECT id, published_at::text, url, hook, text, word_count,
           reactions, comments, likes, reposts, created_at::text
    FROM posts
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `;
  return res.rows.map(rowToPost);
}

export async function getEngagementStats(): Promise<{
  count: number;
  withReactions: number;
  totalReactions: number;
  avgReactions: number | null;
  topReactions: number;
}> {
  const r = await sql<{
    count: number;
    with_reactions: number;
    total_reactions: number;
    avg_reactions: number | null;
    top_reactions: number;
  }>`
    SELECT
      COUNT(*)::int AS count,
      COUNT(*) FILTER (WHERE reactions > 0)::int AS with_reactions,
      COALESCE(SUM(reactions), 0)::int AS total_reactions,
      AVG(NULLIF(reactions, 0))::float8 AS avg_reactions,
      COALESCE(MAX(reactions), 0)::int AS top_reactions
    FROM posts
  `;
  const row = r.rows[0];
  return {
    count: row?.count ?? 0,
    withReactions: row?.with_reactions ?? 0,
    totalReactions: row?.total_reactions ?? 0,
    avgReactions: row?.avg_reactions ?? null,
    topReactions: row?.top_reactions ?? 0,
  };
}

export async function getVoiceProfileMarkdown(): Promise<string> {
  const res = await sql<{ markdown: string }>`SELECT markdown FROM voice_profile WHERE id = 1 LIMIT 1`;
  return res.rows[0]?.markdown ?? "";
}
