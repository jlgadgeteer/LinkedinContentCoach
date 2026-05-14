"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";
import { testProvider } from "@/lib/test-provider";
import { isMissingRelationOrColumn } from "@/lib/db/safe-query";

export type CardState = { error: string | null; ok: string | null };

const ProviderSave = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1),
  apiKey: z.string().optional(),
});

function friendlyError(err: unknown, fallback: string): string {
  if (isMissingRelationOrColumn(err)) {
    return (
      "The database schema looks out of date. Open Settings → Backup → Run schema check, " +
      "then try again."
    );
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function saveProviderSettingsAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  try {
    const parsed = ProviderSave.safeParse({
      provider: formData.get("provider"),
      model: formData.get("model"),
      apiKey: formData.get("apiKey"),
    });
    if (!parsed.success) return { error: "Provider and model are required.", ok: null };

    const newKey = (parsed.data.apiKey ?? "").trim();

    if (newKey) {
      const testErr = await testProvider({
        provider: parsed.data.provider,
        model: parsed.data.model,
        apiKey: newKey,
      });
      if (testErr)
        return {
          error: `Provider rejected the test request. ${testErr}`,
          ok: null,
        };
      const encrypted = await encryptApiKey(newKey);
      await sql`
        INSERT INTO config (id, provider, model, encrypted_api_key, last_verified_at, updated_at)
        VALUES (1, ${parsed.data.provider}, ${parsed.data.model}, ${encrypted}, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          provider = EXCLUDED.provider,
          model = EXCLUDED.model,
          encrypted_api_key = EXCLUDED.encrypted_api_key,
          last_verified_at = now(),
          updated_at = now()
      `;
    } else {
      await sql`
        UPDATE config SET
          provider = ${parsed.data.provider},
          model = ${parsed.data.model},
          updated_at = now()
        WHERE id = 1
      `;
    }

    revalidatePath("/settings");
    return { error: null, ok: "Saved." };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[content-coach] saveProviderSettingsAction failed", err);
    return { error: friendlyError(err, "Couldn't save the provider settings."), ok: null };
  }
}

export async function testProviderAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  try {
    const provider = formData.get("provider")?.toString();
    const model = formData.get("model")?.toString();
    const apiKeyInput = formData.get("apiKey")?.toString().trim();

    if (provider !== "anthropic" && provider !== "openai") {
      return { error: "Pick a provider first.", ok: null };
    }
    if (!model) return { error: "Pick a model first.", ok: null };

    let apiKey = apiKeyInput ?? "";
    if (!apiKey) {
      const row = await sql<{ encrypted_api_key: string | null }>`SELECT encrypted_api_key FROM config WHERE id = 1 LIMIT 1`;
      const enc = row.rows[0]?.encrypted_api_key;
      if (!enc) return { error: "No stored key. Paste one above and try again.", ok: null };
      const decoded = await decryptApiKey(enc);
      if (!decoded) {
        return {
          error:
            "Stored key won't decrypt. AUTH_PASSWORD may have been rotated; paste your key again.",
          ok: null,
        };
      }
      apiKey = decoded;
    }

    const err = await testProvider({ provider, model, apiKey });
    if (err) return { error: `Provider rejected the request. ${err}`, ok: null };

    await sql`UPDATE config SET last_verified_at = now(), updated_at = now() WHERE id = 1`;
    revalidatePath("/settings");
    return { error: null, ok: "Connection OK." };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[content-coach] testProviderAction failed", err);
    return { error: friendlyError(err, "Couldn't test the provider."), ok: null };
  }
}

export async function saveVoiceSettingsAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  const markdown = (formData.get("markdown") ?? "").toString();
  await sql`
    INSERT INTO voice_profile (id, markdown, updated_at)
    VALUES (1, ${markdown}, now())
    ON CONFLICT (id) DO UPDATE SET markdown = EXCLUDED.markdown, updated_at = now()
  `;
  revalidatePath("/settings");
  return { error: null, ok: "Voice profile saved." };
}

const PostInput = z.object({
  id: z.string().optional(),
  external_id: z.string().optional(),
  url: z.string().optional(),
  hook: z.string().optional(),
  text: z.string().min(1),
  date: z.string().optional(),
  published_at: z.string().optional(),
  word_count: z.number().int().optional(),
  reactions: z.number().int().nonnegative().optional(),
  comments: z.number().int().nonnegative().optional(),
  likes: z.number().int().nonnegative().optional(),
  reposts: z.number().int().nonnegative().optional(),
});

async function insertPosts(rows: z.infer<typeof PostInput>[]): Promise<void> {
  for (const p of rows) {
    await sql`
      INSERT INTO posts (
        external_id, url, hook, text, published_at, word_count,
        reactions, comments, likes, reposts, created_at
      )
      VALUES (
        ${p.id ?? p.external_id ?? null},
        ${p.url ?? null},
        ${p.hook ?? null},
        ${p.text},
        ${p.published_at ?? p.date ?? null}::timestamptz,
        ${p.word_count ?? p.text.split(/\s+/).filter(Boolean).length},
        ${p.reactions ?? 0},
        ${p.comments ?? 0},
        ${p.likes ?? 0},
        ${p.reposts ?? 0},
        now()
      )
    `;
  }
}

export async function addPostsAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  const raw = (formData.get("posts") ?? "").toString().trim();
  if (!raw) return { error: "Paste a JSON array of posts to add.", ok: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Not valid JSON.", ok: null };
  }
  const result = z.array(PostInput).safeParse(parsed);
  if (!result.success) {
    return { error: "Each post needs at least a `text` field.", ok: null };
  }
  await insertPosts(result.data);
  revalidatePath("/settings");
  return { error: null, ok: `Added ${result.data.length} post(s).` };
}

export async function replacePostsAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  const raw = (formData.get("posts") ?? "").toString().trim();
  let toInsert: z.infer<typeof PostInput>[] = [];
  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: "Not valid JSON.", ok: null };
    }
    const result = z.array(PostInput).safeParse(parsed);
    if (!result.success) {
      return { error: "Each post needs at least a `text` field.", ok: null };
    }
    toInsert = result.data;
  }
  await sql`DELETE FROM posts`;
  if (toInsert.length) await insertPosts(toInsert);
  revalidatePath("/settings");
  return { error: null, ok: `Corpus replaced with ${toInsert.length} post(s).` };
}
