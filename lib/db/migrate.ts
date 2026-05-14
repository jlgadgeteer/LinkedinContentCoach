import "server-only";
import { sql } from "@vercel/postgres";

/**
 * Idempotent schema bootstrap. Runs CREATE TABLE IF NOT EXISTS for every
 * table in lib/db/schema.ts. Called once per Node worker from
 * instrumentation.ts. Per PLAN.md Phase 2 we deliberately skip a separate
 * migration tool for v1; if the schema evolves, prefer adding columns with
 * IF NOT EXISTS or shipping a one-off ALTER here.
 */
let inFlight: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!inFlight) {
    inFlight = run().catch((err) => {
      inFlight = null;
      throw err;
    });
  }
  return inFlight;
}

async function run(): Promise<void> {
  await sql`
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS voice_profile (
      id integer PRIMARY KEY DEFAULT 1,
      markdown text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT voice_profile_singleton CHECK (id = 1)
    );
  `;

  await sql`
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recent_actions (
      id serial PRIMARY KEY,
      at timestamptz NOT NULL DEFAULT now(),
      kind text NOT NULL,
      title text NOT NULL,
      ref text
    );
  `;

  // Columns added post-MVP so a recent row can be replayed and a draft action
  // can link to a persisted draft row. Idempotent ALTERs keep the bootstrap
  // safe for instances that ran an earlier version.
  await sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS action text;`;
  await sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS input_topic text;`;
  await sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS input_draft text;`;
  await sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS input_query text;`;
  await sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS output text;`;
  await sql`ALTER TABLE recent_actions ADD COLUMN IF NOT EXISTS draft_id uuid;`;

  await sql`
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
  `;

  // Interview Me: knowledge profile is a singleton like voice_profile, edited
  // by AI synthesis after each session and by the user directly in Settings.
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_profile (
      id integer PRIMARY KEY DEFAULT 1,
      markdown text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT knowledge_profile_singleton CHECK (id = 1)
    );
  `;

  await sql`
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
  `;

  await sql`
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
  `;

  // PR 2: engagement columns on posts so voice extraction can weight by what
  // performed and the workspace can surface a "best posts" view.
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS reactions integer NOT NULL DEFAULT 0;`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments integer NOT NULL DEFAULT 0;`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposts integer NOT NULL DEFAULT 0;`;
  await sql`CREATE INDEX IF NOT EXISTS posts_reactions_idx ON posts (reactions DESC);`;

  await sql`CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS recent_actions_at_idx ON recent_actions (at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS drafts_status_idx ON drafts (status);`;
  await sql`CREATE INDEX IF NOT EXISTS drafts_scheduled_for_idx ON drafts (scheduled_for);`;
  await sql`CREATE INDEX IF NOT EXISTS interview_qa_session_idx ON interview_qa (session_id, position);`;
  await sql`CREATE INDEX IF NOT EXISTS interview_sessions_started_idx ON interview_sessions (started_at DESC);`;
}
