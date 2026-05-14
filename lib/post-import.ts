import "server-only";
import { sql } from "@vercel/postgres";

export type QuickAddInput = {
  text: string;
  url?: string;
  hook?: string;
  publishedAt?: string;
};

const META_RE = (name: string) =>
  new RegExp(`<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i");

/**
 * Best-effort fetch of OG metadata from a URL. LinkedIn often blocks anonymous
 * crawlers and returns a generic page, so we tolerate failure quietly. Used to
 * pre-fill the hook / canonical URL on quick-add when the user pastes a URL.
 */
export async function fetchOgMeta(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; ContentCoachBot/1.0; +https://github.com/jlgadgeteer/LinkedinContentCoach)",
        accept: "text/html",
      },
      // Edge runtime fetch supports a 10s timeout via AbortSignal.
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    const body = await res.text();
    const slice = body.slice(0, 200_000); // cap parsed HTML to avoid pathological pages
    const get = (n: string) => slice.match(META_RE(n))?.[1];
    return {
      title: get("og:title") ?? get("twitter:title"),
      description: get("og:description") ?? get("twitter:description") ?? get("description"),
      image: get("og:image") ?? get("twitter:image"),
    };
  } catch {
    return null;
  }
}

export async function quickAddPost(input: QuickAddInput): Promise<string> {
  const text = input.text.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hook = (input.hook ?? text.split(/\n/).map((s) => s.trim()).find(Boolean) ?? "").slice(0, 500);
  const res = await sql<{ id: string }>`
    INSERT INTO posts (url, hook, text, published_at, word_count, created_at)
    VALUES (
      ${input.url ?? null},
      ${hook},
      ${text},
      ${input.publishedAt ?? null}::timestamptz,
      ${wordCount},
      now()
    )
    RETURNING id::text
  `;
  return res.rows[0]!.id;
}
