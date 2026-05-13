// Single endpoint for all four actions: draft, ideate, search, check.
// The action determines which skill prompt to assemble.
// The user's API key is sent in the body and used per-request; never logged.

import { z } from "zod";
import { streamCompletion } from "@/lib/llm";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompts";

export const runtime = "edge"; // streaming works best on edge runtime

const PostSchema = z.object({
  id: z.string(),
  date: z.string(),
  url: z.string(),
  hook: z.string(),
  text: z.string(),
  wordCount: z.number(),
  createdAt: z.number(),
});

const RequestSchema = z.object({
  action: z.enum(["draft", "ideate", "search", "check"]),
  topic: z.string().optional(),
  draft: z.string().optional(),
  query: z.string().optional(),
  posts: z.array(PostSchema).default([]),
  voiceProfile: z.string().default(""),
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1),
  apiKey: z.string().min(1),
});

export async function POST(req: Request) {
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

  const { action, topic, draft, query, posts, voiceProfile, provider, model, apiKey } = parsed.data;

  const system = buildSystemPrompt({ action, voiceProfile, posts });
  const user = buildUserMessage({ action, topic, draft, query });

  try {
    const result = await streamCompletion({
      provider,
      model,
      apiKey,
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
