import "server-only";
import { sql } from "@vercel/postgres";
import { safeQuery } from "@/lib/db/safe-query";

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

type CfgRow = {
  provider: string | null;
  model: string | null;
  encrypted_api_key: string | null;
  last_verified_at: string | null;
  updated_at: string | null;
};

type VoiceRow = {
  markdown: string;
  updated_at: string | null;
};

type StatsRow = {
  count: number;
  oldest: string | null;
  newest: string | null;
  latest_created: string | null;
  with_reactions: number;
  top_reactions: number;
  avg_reactions: number | null;
};

const EMPTY_STATS: StatsRow = {
  count: 0,
  oldest: null,
  newest: null,
  latest_created: null,
  with_reactions: 0,
  top_reactions: 0,
  avg_reactions: null,
};

export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  // Each table or column is queried independently and falls back to a sensible
  // empty default if the migration hasn't applied the relevant schema yet.
  // Without this, a partial migration would 500 the entire settings page.
  const cfgPromise = safeQuery(
    () =>
      sql<CfgRow>`SELECT provider, model, encrypted_api_key, last_verified_at::text, updated_at::text FROM config WHERE id = 1 LIMIT 1`.then(
        (r) => r.rows[0] ?? null,
      ),
    null as CfgRow | null,
    "settings.config",
  );

  const voicePromise = safeQuery(
    () =>
      sql<VoiceRow>`SELECT markdown, updated_at::text FROM voice_profile WHERE id = 1 LIMIT 1`.then(
        (r) => r.rows[0] ?? null,
      ),
    null as VoiceRow | null,
    "settings.voice_profile",
  );

  const knowledgePromise = safeQuery(
    () =>
      sql<VoiceRow>`SELECT markdown, updated_at::text FROM knowledge_profile WHERE id = 1 LIMIT 1`.then(
        (r) => r.rows[0] ?? null,
      ),
    null as VoiceRow | null,
    "settings.knowledge_profile",
  );

  const statsPromise = safeQuery(
    async () => {
      // Try the full query first (with engagement columns).
      try {
        const res = await sql<StatsRow>`
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
        return res.rows[0] ?? EMPTY_STATS;
      } catch (err) {
        // Fall back to the engagement-less query if the new columns aren't
        // there yet. Re-throw any other error.
        if (!(err instanceof Error) || !/column .* does not exist/i.test(err.message)) {
          throw err;
        }
        const res = await sql<{
          count: number;
          oldest: string | null;
          newest: string | null;
          latest_created: string | null;
        }>`
          SELECT
            COUNT(*)::int AS count,
            MIN(published_at)::text AS oldest,
            MAX(published_at)::text AS newest,
            MAX(created_at)::text AS latest_created
          FROM posts
        `;
        const row = res.rows[0];
        return {
          count: row?.count ?? 0,
          oldest: row?.oldest ?? null,
          newest: row?.newest ?? null,
          latest_created: row?.latest_created ?? null,
          with_reactions: 0,
          top_reactions: 0,
          avg_reactions: null,
        };
      }
    },
    EMPTY_STATS,
    "settings.posts",
  );

  const [cfgRow, voiceRow, knowledgeRow, statsRow] = await Promise.all([
    cfgPromise,
    voicePromise,
    knowledgePromise,
    statsPromise,
  ]);

  const provider =
    cfgRow?.provider === "anthropic" || cfgRow?.provider === "openai"
      ? cfgRow.provider
      : null;

  const lastCandidates = [
    cfgRow?.updated_at,
    voiceRow?.updated_at,
    knowledgeRow?.updated_at,
    statsRow.latest_created,
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
    postCount: statsRow.count,
    postDateRange: {
      oldest: statsRow.oldest,
      newest: statsRow.newest,
    },
    postsCreatedAt: statsRow.latest_created,
    postsWithReactions: statsRow.with_reactions,
    topReactions: statsRow.top_reactions,
    avgReactions: statsRow.avg_reactions,
    lastSavedAt: lastCandidates.length ? lastCandidates[lastCandidates.length - 1]! : null,
  };
}
