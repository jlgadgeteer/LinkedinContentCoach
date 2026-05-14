import "server-only";
import { sql } from "@vercel/postgres";

/**
 * Idempotent schema bootstrap. Each statement runs independently so a single
 * failure (e.g. an unsupported pg feature in a particular environment) does
 * not block the rest. Failures are collected and surfaced via /api/admin/migrate
 * so the operator can see exactly what went wrong without grepping logs.
 *
 * Called once per Node worker from instrumentation.ts. Per PLAN.md Phase 2 we
 * deliberately skip a separate migration tool for v1; if the schema evolves,
 * prefer adding columns with IF NOT EXISTS or shipping a one-off ALTER here.
 */
export type MigrationFailure = { statement: string; error: string };

let cachedResult: Promise<MigrationFailure[]> | null = null;

export function ensureSchema(): Promise<MigrationFailure[]> {
  if (!cachedResult) {
    cachedResult = run().catch((err) => {
      // run() never throws (each statement is isolated), but if it does for
      // some reason, surface it as a single failure entry so callers see it.
      cachedResult = null;
      return [
        {
          statement: "ensureSchema()",
          error: err instanceof Error ? err.message : String(err),
        },
      ];
    });
  }
  return cachedResult;
}

/**
 * Force a fresh migration run. Used by /api/admin/migrate so the operator can
 * re-attempt after fixing an underlying issue without needing a redeploy.
 */
export async function ensureSchemaFresh(): Promise<MigrationFailure[]> {
  cachedResult = null;
  return ensureSchema();
}

type Stmt = { label: string; run: () => Promise<unknown> };

async function run(): Promise<MigrationFailure[]> {
  const failures: MigrationFailure[] = [];
  for (const stmt of STATEMENTS) {
    try {
      await stmt.run();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ statement: stmt.label, error: message });
      // eslint-disable-next-line no-console
      console.error(`[content-coach] migration failed: ${stmt.label}`, err);
    }
  }
  return failures;
}

const STATEMENTS: Stmt[] = [
  {
    label: "create config",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS config (
        id integer PRIMARY KEY DEFAULT 1,
        password_hash text,
        provider text,
        model text,
        encrypted_api_key text,
        setup_completed_at timestamptz,
        last_verified_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT config_singleton CHECK (id = 1)
      );
    `,
  },
  {
    label: "create voice_profile",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS voice_profile (
        id integer PRIMARY KEY DEFAULT 1,
        markdown text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT voice_profile_singleton CHECK (id = 1)
      );
    `,
  },
  {
    label: "create posts",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id text,
        published_at timestamptz,
        url text,
        hook text,
        text text NOT NULL,
        word_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  },
  {
    label: "create recent_actions",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS recent_actions (
        id serial PRIMARY KEY,
        at timestamptz NOT NULL DEFAULT now(),
        kind text NOT NULL,
        title text NOT NULL,
        ref text
      );
    `,
  },
  { label: "alter recent_actions add action", run: () => sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS action text;` },
  { label: "alter recent_actions add input_topic", run: () => sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS input_topic text;` },
  { label: "alter recent_actions add input_draft", run: () => sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS input_draft text;` },
  { label: "alter recent_actions add input_query", run: () => sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS input_query text;` },
  { label: "alter recent_actions add output", run: () => sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS output text;` },
  { label: "alter recent_actions add draft_id", run: () => sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS draft_id uuid;` },
  {
    label: "create drafts",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS drafts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        topic text,
        body text NOT NULL,
        status text NOT NULL DEFAULT 'not_published',
        scheduled_for timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT drafts_status_check
          CHECK (status IN ('not_published', 'scheduled', 'published'))
      );
    `,
  },
  {
    label: "alter config add action_settings",
    run: () => sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS action_settings jsonb NOT NULL DEFAULT '{}'::jsonb;`,
  },
  {
    label: "create quality_rules",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS quality_rules (
        id integer PRIMARY KEY DEFAULT 1,
        markdown text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT quality_rules_singleton CHECK (id = 1)
      );
    `,
  },
  {
    label: "create writing_modes",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS writing_modes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        markdown text NOT NULL DEFAULT '',
        position integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  },
  {
    label: "create knowledge_profile",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS knowledge_profile (
        id integer PRIMARY KEY DEFAULT 1,
        markdown text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT knowledge_profile_singleton CHECK (id = 1)
      );
    `,
  },
  {
    label: "create interview_sessions",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at timestamptz NOT NULL DEFAULT now(),
        ended_at timestamptz,
        status text NOT NULL DEFAULT 'active',
        questions_count integer NOT NULL DEFAULT 0,
        dimensions_covered jsonb NOT NULL DEFAULT '{}'::jsonb,
        summary text,
        proposed_voice_profile text,
        proposed_knowledge text,
        CONSTRAINT interview_sessions_status_check
          CHECK (status IN ('active', 'ended', 'applied', 'cancelled'))
      );
    `,
  },
  {
    label: "create interview_qa",
    run: () => sql`
      CREATE TABLE IF NOT EXISTS interview_qa (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
        position integer NOT NULL,
        dimension text,
        question text NOT NULL,
        answer text,
        asked_at timestamptz NOT NULL DEFAULT now(),
        answered_at timestamptz
      );
    `,
  },
  { label: "alter posts add reactions", run: () => sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS reactions integer NOT NULL DEFAULT 0;` },
  { label: "alter posts add comments", run: () => sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments integer NOT NULL DEFAULT 0;` },
  { label: "alter posts add likes", run: () => sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;` },
  { label: "alter posts add reposts", run: () => sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposts integer NOT NULL DEFAULT 0;` },
  { label: "create posts.reactions index", run: () => sql`CREATE INDEX IF NOT EXISTS posts_reactions_idx ON posts (reactions DESC);` },
  { label: "create posts.published_at index", run: () => sql`CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC);` },
  { label: "create recent_actions.at index", run: () => sql`CREATE INDEX IF NOT EXISTS recent_actions_at_idx ON recent_actions (at DESC);` },
  { label: "create drafts.status index", run: () => sql`CREATE INDEX IF NOT EXISTS drafts_status_idx ON drafts (status);` },
  { label: "create drafts.scheduled_for index", run: () => sql`CREATE INDEX IF NOT EXISTS drafts_scheduled_for_idx ON drafts (scheduled_for);` },
  { label: "create writing_modes.position index", run: () => sql`CREATE INDEX IF NOT EXISTS writing_modes_position_idx ON writing_modes (position);` },
  { label: "create interview_qa.session index", run: () => sql`CREATE INDEX IF NOT EXISTS interview_qa_session_idx ON interview_qa (session_id, position);` },
  { label: "create interview_sessions.started index", run: () => sql`CREATE INDEX IF NOT EXISTS interview_sessions_started_idx ON interview_sessions (started_at DESC);` },
];
