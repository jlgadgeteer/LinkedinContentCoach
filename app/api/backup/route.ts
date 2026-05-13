import NextAuth from "next-auth";
import { sql } from "@vercel/postgres";
import { authConfig } from "@/lib/auth.config";

export const runtime = "nodejs";

const { auth } = NextAuth(authConfig);

/**
 * Returns a JSON backup of the voice profile + post corpus. The API key is
 * deliberately excluded — backups are meant to be portable across deploys
 * and the key is tied to a specific AUTH_PASSWORD via ADR-008.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const voice = await sql<{ markdown: string }>`SELECT markdown FROM voice_profile WHERE id = 1 LIMIT 1`;
  const posts = await sql<{
    external_id: string | null;
    published_at: string | null;
    url: string | null;
    hook: string | null;
    text: string;
    word_count: number;
  }>`SELECT external_id, published_at::text, url, hook, text, word_count FROM posts ORDER BY published_at DESC NULLS LAST, created_at DESC`;

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    voiceProfile: voice.rows[0]?.markdown ?? "",
    posts: posts.rows.map((r) => ({
      external_id: r.external_id,
      published_at: r.published_at,
      url: r.url,
      hook: r.hook,
      text: r.text,
      word_count: r.word_count,
    })),
  };

  const stamp = new Date().toISOString().replace(/[:T]/g, "-").replace(/\..*/, "");
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="content-coach-backup-${stamp}.json"`,
    },
  });
}
