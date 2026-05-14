import "server-only";
import { sql } from "@vercel/postgres";

export type SettingsSnapshot = {
  provider: "anthropic" | "openai" | null;
  model: string | null;
  hasApiKey: boolean;
  lastVerifiedAt: string | null;
  voiceProfileMarkdown: string;
  voiceProfileUpdatedAt: string | null;
  knowledgeProfileMarkdown: string;
  knowledgeProfileUpdatedAt: string | null;
  postCount: number;
  postDateRange: { oldest: string | null; newest: string | null };
  postsCreatedAt: string | null;
  postsWithReactions: number;
  topReactions: number;
  avgReactions: number | null;
  lastSavedAt: string | null;
};

export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  const cfg = await sql<{
    provider: string | null;
    model: string | null;
    encrypted_api_key: string | null;
    last_verified_at: string | null;
    updated_at: string | null;
  }>`SELECT provider, model, encrypted_api_key, last_verified_at::text, updated_at::text FROM config WHERE id = 1 LIMIT 1`;

  const voice = await sql<{
    markdown: string;
    updated_at: string | null;
  }>`SELECT markdown, updated_at::text FROM voice_profile WHERE id = 1 LIMIT 1`;

  const knowledge = await sql<{
    markdown: string;
    updated_at: string | null;
  }>`SELECT markdown, updated_at::text FROM knowledge_profile WHERE id = 1 LIMIT 1`;

  const stats = await sql<{
    count: number;
    oldest: string | null;
    newest: string | null;
    latest_created: string | null;
    with_reactions: number;
    top_reactions: number;
    avg_reactions: number | null;
  }>`
    SELECT
      COUNT(*)::int AS count,
      MIN(published_at)::text AS oldest,
      MAX(published_at)::text AS newest,
      MAX(created_at)::text AS latest_created,
      COUNT(*) FILTER (WHERE reactions > 0)::int AS with_reactions,
      COALESCE(MAX(reactions), 0)::int AS top_reactions,
      AVG(NULLIF(reactions, 0))::float8 AS avg_reactions
    FROM posts
  `;

  const cfgRow = cfg.rows[0];
  const voiceRow = voice.rows[0];
  const knowledgeRow = knowledge.rows[0];
  const statsRow = stats.rows[0];

  const provider =
    cfgRow?.provider === "anthropic" || cfgRow?.provider === "openai"
      ? cfgRow.provider
      : null;

  const lastCandidates = [
    cfgRow?.updated_at,
    voiceRow?.updated_at,
    knowledgeRow?.updated_at,
    statsRow?.latest_created,
  ]
    .filter((x): x is string => !!x)
    .sort();

  return {
    provider,
    model: cfgRow?.model ?? null,
    hasApiKey: !!cfgRow?.encrypted_api_key,
    lastVerifiedAt: cfgRow?.last_verified_at ?? null,
    voiceProfileMarkdown: voiceRow?.markdown ?? "",
    voiceProfileUpdatedAt: voiceRow?.updated_at ?? null,
    knowledgeProfileMarkdown: knowledgeRow?.markdown ?? "",
    knowledgeProfileUpdatedAt: knowledgeRow?.updated_at ?? null,
    postCount: statsRow?.count ?? 0,
    postDateRange: {
      oldest: statsRow?.oldest ?? null,
      newest: statsRow?.newest ?? null,
    },
    postsCreatedAt: statsRow?.latest_created ?? null,
    postsWithReactions: statsRow?.with_reactions ?? 0,
    topReactions: statsRow?.top_reactions ?? 0,
    avgReactions: statsRow?.avg_reactions ?? null,
    lastSavedAt: lastCandidates.length ? lastCandidates[lastCandidates.length - 1]! : null,
  };
}
