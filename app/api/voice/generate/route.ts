import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { getResolvedProvider } from "@/lib/api-key";
import { generateOnce } from "@/lib/llm";
import { getRecentPosts, getTopPostsByReactions } from "@/lib/posts";
import { VOICE_EXTRACTION_SKILL } from "@/lib/prompts/skills";

const { auth } = NextAuth(authConfig);

export const runtime = "edge";

function formatPostsForExtraction(
  topPosts: { hook: string; text: string; reactions: number; date: string }[],
  recentPosts: { hook: string; text: string; reactions: number; date: string }[],
): string {
  const seen = new Set<string>();
  const all: { label: string; hook: string; text: string; reactions: number; date: string }[] = [];
  for (const p of topPosts) {
    const key = (p.hook + "::" + p.text).slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    all.push({ ...p, label: "TOP" });
  }
  for (const p of recentPosts) {
    const key = (p.hook + "::" + p.text).slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    all.push({ ...p, label: "RECENT" });
  }
  return all
    .map(
      (p, i) =>
        `### Post ${i + 1} [${p.label}]\n**Date:** ${p.date}\n**Hook:** ${p.hook}\n**Reactions:** ${p.reactions}\n\n${p.text}`,
    )
    .join("\n\n---\n\n");
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const provider = await getResolvedProvider();
  if (!provider) {
    return new Response(
      JSON.stringify({
        error: "Configure a provider in Settings before generating a voice profile.",
      }),
      { status: 412, headers: { "content-type": "application/json" } },
    );
  }

  const [top, recent] = await Promise.all([
    getTopPostsByReactions(10),
    getRecentPosts(15),
  ]);

  if (top.length === 0 && recent.length === 0) {
    return new Response(
      JSON.stringify({
        error:
          "No posts in the corpus yet. Import at least 5 posts under Settings → Post corpus before generating.",
      }),
      { status: 412, headers: { "content-type": "application/json" } },
    );
  }
  if (top.length + recent.length < 5) {
    return new Response(
      JSON.stringify({
        error:
          "Need at least 5 posts to extract a meaningful voice profile. Import more under Settings → Post corpus.",
      }),
      { status: 412, headers: { "content-type": "application/json" } },
    );
  }

  const userMsg =
    "Here is a sample of the creator's posts. Read them, then produce a voice profile per the skill rules.\n\n" +
    formatPostsForExtraction(top, recent);

  let raw: string;
  try {
    raw = await generateOnce({
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      system: VOICE_EXTRACTION_SKILL,
      user: userMsg,
      temperature: 0.4,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Provider call failed",
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  return Response.json({
    markdown: raw.trim(),
    topCount: top.length,
    recentCount: recent.length,
  });
}
