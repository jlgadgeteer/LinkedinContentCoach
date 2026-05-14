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

  // PR 1: per-action LLM params live as JSON on config so we don't fan out into
  // a wide column-per-action shape. Default {} means "use the built-in
  // defaults" (0.8 for draft, 0.6 for others, no model override).
  await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS action_settings jsonb NOT NULL DEFAULT '{}'::jsonb;`;

  // PR 1: editable AI-tells / quality rules. Singleton like voice_profile.
  await sql`
    CREATE TABLE IF NOT EXISTS quality_rules (
      id integer PRIMARY KEY DEFAULT 1,
      markdown text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT quality_rules_singleton CHECK (id = 1)
    );
  `;

  // PR 1: named writing modes are user-managed prompt presets the Draft action
  // can opt into. position drives display order on the dropdown.
  await sql`
    CREATE TABLE IF NOT EXISTS writing_modes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      markdown text NOT NULL DEFAULT '',
      position integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS recent_actions_at_idx ON recent_actions (at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS drafts_status_idx ON drafts (status);`;
  await sql`CREATE INDEX IF NOT EXISTS drafts_scheduled_for_idx ON drafts (scheduled_for);`;
  await sql`CREATE INDEX IF NOT EXISTS writing_modes_position_idx ON writing_modes (position);`;
}
