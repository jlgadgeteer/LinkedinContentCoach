"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { encryptApiKey } from "@/lib/crypto";
import { testProvider } from "@/lib/test-provider";

const ProviderSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1),
  apiKey: z.string().min(1),
});

export type ActionState = { error: string | null };

export async function saveProviderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ProviderSchema.safeParse({
    provider: formData.get("provider"),
    model: formData.get("model"),
    apiKey: formData.get("apiKey"),
  });
  if (!parsed.success) return { error: "Fill in every field." };

  const testErr = await testProvider(parsed.data);
  if (testErr) return { error: `Provider rejected the test request. ${testErr}` };

  const encrypted = encryptApiKey(parsed.data.apiKey);

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

  redirect("/setup?step=2");
}

export async function saveVoiceProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const markdown = (formData.get("markdown") ?? "").toString();

  await sql`
    INSERT INTO voice_profile (id, markdown, updated_at)
    VALUES (1, ${markdown}, now())
    ON CONFLICT (id) DO UPDATE SET markdown = EXCLUDED.markdown, updated_at = now()
  `;

  redirect("/setup?step=3");
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
});

const PostArray = z.array(PostInput);

export async function savePostsAndFinishAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = (formData.get("posts") ?? "").toString().trim();

  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: "Post corpus isn't valid JSON. Paste an array of posts." };
    }
    const result = PostArray.safeParse(parsed);
    if (!result.success) {
      return { error: "Each post needs at least a `text` field. Check the format." };
    }

    if (result.data.length > 0) {
      const values = result.data.map((p) => ({
        external_id: p.id ?? p.external_id ?? null,
        url: p.url ?? null,
        hook: p.hook ?? null,
        text: p.text,
        published_at: p.published_at ?? p.date ?? null,
        word_count: p.word_count ?? p.text.split(/\s+/).filter(Boolean).length,
      }));

      // Bulk insert by interpolating each row. Postgres parameter count is
      // generous for typical corpora (a few hundred posts).
      for (const v of values) {
        await sql`
          INSERT INTO posts (external_id, url, hook, text, published_at, word_count, created_at)
          VALUES (
            ${v.external_id},
            ${v.url},
            ${v.hook},
            ${v.text},
            ${v.published_at}::timestamptz,
            ${v.word_count},
            now()
          )
        `;
      }
    }
  }

  await sql`UPDATE config SET setup_completed_at = now(), updated_at = now() WHERE id = 1`;
  redirect("/");
}

export async function finishWithoutPostsAction(): Promise<void> {
  await sql`UPDATE config SET setup_completed_at = now(), updated_at = now() WHERE id = 1`;
  redirect("/");
}
