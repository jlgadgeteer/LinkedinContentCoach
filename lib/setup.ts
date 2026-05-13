import "server-only";
import { sql } from "@vercel/postgres";

export type SetupState = {
  hasProvider: boolean;
  hasVoiceProfile: boolean;
  hasPosts: boolean;
  isComplete: boolean;
  postCount: number;
};

export async function getSetupState(): Promise<SetupState> {
  const cfg = await sql<{
    encrypted_api_key: string | null;
    setup_completed_at: Date | null;
  }>`SELECT encrypted_api_key, setup_completed_at FROM config WHERE id = 1 LIMIT 1`;

  const voice = await sql<{ markdown: string }>`SELECT markdown FROM voice_profile WHERE id = 1 LIMIT 1`;

  const postCountRow = await sql<{ count: number }>`SELECT COUNT(*)::int AS count FROM posts`;

  const cfgRow = cfg.rows[0];
  const voiceRow = voice.rows[0];

  return {
    hasProvider: !!cfgRow?.encrypted_api_key,
    hasVoiceProfile: !!(voiceRow?.markdown && voiceRow.markdown.trim().length > 0),
    hasPosts: (postCountRow.rows[0]?.count ?? 0) > 0,
    isComplete: !!cfgRow?.setup_completed_at,
    postCount: postCountRow.rows[0]?.count ?? 0,
  };
}

/**
 * Returns 1, 2, or 3 based on which step the user should land on if they
 * hit /setup without a ?step= hint. Used both for the initial redirect and
 * after each step's save action.
 */
export function nextNeededStep(state: SetupState): 1 | 2 | 3 {
  if (!state.hasProvider) return 1;
  if (!state.hasVoiceProfile) return 2;
  return 3;
}
