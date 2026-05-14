import NextAuth from "next-auth";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { authConfig } from "@/lib/auth.config";
import { getResolvedProvider } from "@/lib/api-key";
import { streamCompletion } from "@/lib/llm";
import { getPostsForPrompt, getVoiceProfileMarkdown } from "@/lib/posts";
import { getKnowledgeMarkdown } from "@/lib/knowledge";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompts";
import { extractPostBody, titleFromBody } from "@/lib/drafts";

// ADR-006: edge runtime for streaming.
export const runtime = "edge";

const { auth } = NextAuth(authConfig);

const RequestSchema = z.object({
  action: z.enum(["draft", "ideate", "search", "check", "revise"]),
  topic: z.string().optional(),
  draft: z.string().optional(),
  query: z.string().optional(),
  original: z.string().optional(),
  instruction: z.string().optional(),
});

const KIND_BY_ACTION = {
  draft: "DRAFT",
  ideate: "IDEATE",
  search: "SEARCH",
  check: "QC",
  revise: "DRAFT",
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
    revise: "Revised draft",
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

  const [voiceProfile, posts, knowledge] = await Promise.all([
    getVoiceProfileMarkdown(),
    getPostsForPrompt(),
    getKnowledgeMarkdown(),
  ]);

  const { action, topic, draft, query, original, instruction } = parsed.data;

  const inputForTitle =
    action === "revise" ? instruction ?? "" : topic ?? query ?? draft ?? "";
  const recentTitle = titleFor(action, inputForTitle);

  // Persist the input up front so the workspace can show the row even if the
  // stream fails mid-flight. The output column gets filled in by onFinish.
  // Revisions store the instruction in input_topic and the original in
  // input_draft so the recent viewer can replay both.
  const persistTopic = action === "revise" ? instruction : topic;
  const persistDraft = action === "revise" ? original : draft;
  const inserted = await sql<{ id: number }>`
    INSERT INTO recent_actions (
      kind, title, action, input_topic, input_draft, input_query
    )
    VALUES (
      ${KIND_BY_ACTION[action]},
      ${recentTitle},
      ${action},
      ${persistTopic ?? null},
      ${persistDraft ?? null},
      ${query ?? null}
    )
    RETURNING id
  `;
  const recentId = inserted.rows[0]!.id;

  const system = buildSystemPrompt({ action, voiceProfile, posts, knowledge });
  const user = buildUserMessage({ action, topic, draft, query, original, instruction });

  try {
    const result = await streamCompletion({
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      system,
      user,
      temperature: action === "draft" || action === "revise" ? 0.8 : 0.6,
      onFinish: async ({ text }) => {
        try {
          if ((action === "draft" || action === "revise") && text.trim()) {
            const postBody = extractPostBody(text);
            const draftTitle = titleFromBody(postBody, recentTitle);
            const created = await sql<{ id: string }>`
              INSERT INTO drafts (title, topic, body, status)
              VALUES (${draftTitle}, ${topic ?? null}, ${postBody}, 'not_published')
              RETURNING id::text
            `;
            const draftId = created.rows[0]!.id;
            await sql`
              UPDATE recent_actions
              SET output = ${text}, draft_id = ${draftId}::uuid
              WHERE id = ${recentId}
            `;
          } else {
            await sql`
              UPDATE recent_actions
              SET output = ${text}
              WHERE id = ${recentId}
            `;
          }
        } catch {
          // Persistence is best-effort; the stream still went to the user.
          // Logging through console keeps the edge runtime simple.
          // eslint-disable-next-line no-console
          console.warn("recent_actions / drafts persistence failed");
        }
      },
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
