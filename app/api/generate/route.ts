import NextAuth from "next-auth";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { authConfig } from "@/lib/auth.config";
import { getResolvedProvider } from "@/lib/api-key";
import { streamCompletion } from "@/lib/llm";
import { getPostsForPrompt, getVoiceProfileMarkdown } from "@/lib/posts";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompts";

// ADR-006: edge runtime for streaming.
export const runtime = "edge";

const { auth } = NextAuth(authConfig);

const RequestSchema = z.object({
  action: z.enum(["draft", "ideate", "search", "check"]),
  topic: z.string().optional(),
  draft: z.string().optional(),
  query: z.string().optional(),
});

const KIND_BY_ACTION = {
  draft: "DRAFT",
  ideate: "IDEATE",
  search: "SEARCH",
  check: "QC",
} as const;

function titleFor(action: keyof typeof KIND_BY_ACTION, input: string): string {
  const trimmed = (input ?? "").trim();
  const head = trimmed.length > 64 ? trimmed.slice(0, 61) + "…" : trimmed;
  if (head) return head;
  return {
    draft: "Untitled draft",
    ideate: "Ideation",
    search: "Search",
    check: "Quality check",
  }[action];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const provider = await getResolvedProvider();
  if (!provider) {
    return new Response(
      JSON.stringify({
        error:
          "No provider configured. Open Settings and connect a model before running an action.",
      }),
      { status: 412, headers: { "content-type": "application/json" } },
    );
  }

  const [voiceProfile, posts] = await Promise.all([
    getVoiceProfileMarkdown(),
    getPostsForPrompt(),
  ]);

  const { action, topic, draft, query } = parsed.data;

  const inputForTitle = topic ?? query ?? draft ?? "";
  // Record the recent action up front so the workspace can show it even
  // if the stream fails mid-flight.
  await sql`
    INSERT INTO recent_actions (kind, title, ref)
    VALUES (${KIND_BY_ACTION[action]}, ${titleFor(action, inputForTitle)}, NULL)
  `;

  const system = buildSystemPrompt({ action, voiceProfile, posts });
  const user = buildUserMessage({ action, topic, draft, query });

  try {
    const result = await streamCompletion({
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      system,
      user,
      temperature: action === "draft" ? 0.8 : 0.6,
    });
    return result.toTextStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Provider call failed", details: message }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}
