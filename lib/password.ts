import "server-only";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";

const MIN_PASSWORD_LENGTH = 12;

type ConfigRow = {
  password_hash: string | null;
};

/**
 * Verifies the supplied password against the stored bcrypt hash.
 *
 * First-login bootstrap (per ADR-002): if no `password_hash` is stored
 * yet, accept the password if it matches the `AUTH_PASSWORD` env var,
 * hash it, persist it, and let the user in. Subsequent logins compare
 * against the stored hash and ignore the env var.
 *
 * Returns false rather than throwing for any failure, so callers can
 * uniformly treat "not authenticated".
 */
export async function verifyPassword(input: string): Promise<boolean> {
  if (!input) return false;

  const result = await sql<ConfigRow>`SELECT password_hash FROM config WHERE id = 1 LIMIT 1`;
  const stored = result.rows[0]?.password_hash ?? null;

  if (!stored) {
    return bootstrapFromEnv(input);
  }

  return bcrypt.compare(input, stored);
}

async function bootstrapFromEnv(input: string): Promise<boolean> {
  const seed = process.env.AUTH_PASSWORD;
  if (!seed) return false;
  if (seed.length < MIN_PASSWORD_LENGTH) return false;
  if (input !== seed) return false;

  const hash = await bcrypt.hash(seed, 12);
  await sql`
    INSERT INTO config (id, password_hash, updated_at)
    VALUES (1, ${hash}, now())
    ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()
  `;
  return true;
}

export const MIN_AUTH_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH;
