import { sql } from "@vercel/postgres";
import { decryptApiKey } from "@/lib/crypto";

export type ResolvedProvider = {
  provider: "anthropic" | "openai";
  model: string;
  apiKey: string;
};

/**
 * Pulls the provider config out of the DB and decrypts the API key.
 * Returns null when setup hasn't been completed. Edge-compatible because
 * @vercel/postgres uses HTTP and lib/crypto.ts uses Web Crypto.
 */
export async function getResolvedProvider(): Promise<ResolvedProvider | null> {
  const res = await sql<{
    provider: string | null;
    model: string | null;
    encrypted_api_key: string | null;
  }>`SELECT provider, model, encrypted_api_key FROM config WHERE id = 1 LIMIT 1`;

  const row = res.rows[0];
  if (!row?.provider || !row?.model || !row?.encrypted_api_key) return null;
  if (row.provider !== "anthropic" && row.provider !== "openai") return null;

  const apiKey = await decryptApiKey(row.encrypted_api_key);
  if (!apiKey) return null;

  return { provider: row.provider, model: row.model, apiKey };
}
