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

  await sql`CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS recent_actions_at_idx ON recent_actions (at DESC);`;
}
