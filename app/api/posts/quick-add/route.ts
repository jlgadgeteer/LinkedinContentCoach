import NextAuth from "next-auth";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { fetchOgMeta, quickAddPost } from "@/lib/post-import";

const { auth } = NextAuth(authConfig);

export const runtime = "edge";

const Body = z.object({
  url: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  text: z.string().optional(),
  publishedAt: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return jsonError(401, "Unauthorized");
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return jsonError(400, "Invalid request body");
  }

  let text = (parsed.text ?? "").trim();
  let hookCandidate: string | undefined;

  if (!text && parsed.url) {
    // No text was pasted; try to harvest something from OG metadata.
    const meta = await fetchOgMeta(parsed.url);
    if (meta?.description && meta.description.length > 30) {
      text = meta.description.trim();
      hookCandidate = meta.title?.trim();
    } else if (meta?.title) {
      text = meta.title.trim();
    }
  }

  if (!text || text.length < 10) {
    return jsonError(
      422,
      "Need at least 10 characters of post text. LinkedIn doesn't expose post bodies via OG metadata; paste the text yourself or include a longer excerpt.",
    );
  }

  const id = await quickAddPost({
    text,
    url: parsed.url,
    hook: hookCandidate,
    publishedAt: parsed.publishedAt,
  });
  return Response.json({ id, ok: true });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
