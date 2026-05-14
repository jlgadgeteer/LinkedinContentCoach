import NextAuth from "next-auth";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { getResolvedProvider } from "@/lib/api-key";
import { generateOnce } from "@/lib/llm";
import { getVoiceProfileMarkdown } from "@/lib/posts";
import { getKnowledgeMarkdown } from "@/lib/knowledge";
import { getSessionDetail, recordAnswer, setSessionStatus } from "@/lib/interview";
import { INTERVIEW_SYNTHESIS_SKILL } from "@/lib/prompts/skills";
import { buildSynthesisUserMessage, parseSynthesis } from "@/lib/interview-prompt";

const { auth } = NextAuth(authConfig);

export const runtime = "edge";

const Body = z.object({
  sessionId: z.string().uuid(),
  // Optional last answer (when user types into the answer box and clicks Wrap up
  // without first hitting Save & next).
  qaId: z.string().uuid().optional(),
  answer: z.string().max(20000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return jsonError(401, "Unauthorized");

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return jsonError(400, "Invalid request body");
  }

  if (parsed.qaId && parsed.answer && parsed.answer.trim().length > 0) {
    await recordAnswer(parsed.qaId, parsed.answer);
  }

  const detail = await getSessionDetail(parsed.sessionId);
  if (!detail) return jsonError(404, "Session not found");

  const answeredQa = detail.qa.filter((q) => q.answer && q.answer.trim().length > 0);
  if (answeredQa.length === 0) {
    await setSessionStatus(parsed.sessionId, "cancelled", {
      summary: "Cancelled before any questions were answered.",
    });
    return Response.json({ ok: true, cancelled: true });
  }

  const provider = await getResolvedProvider();
  if (!provider) return jsonError(412, "Configure a provider before ending the interview.");

  const [voice, knowledge] = await Promise.all([
    getVoiceProfileMarkdown(),
    getKnowledgeMarkdown(),
  ]);

  const userMsg = buildSynthesisUserMessage({
    qa: answeredQa,
    voiceProfile: voice,
    knowledge,
  });

  let raw: string;
  try {
    raw = await generateOnce({
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      system: INTERVIEW_SYNTHESIS_SKILL,
      user: userMsg,
      temperature: 0.4,
    });
  } catch (err) {
    return jsonError(502, err instanceof Error ? err.message : "Synthesis call failed");
  }

  const out = parseSynthesis(raw);
  if (!out.voice && !out.knowledge) {
    return jsonError(502, "Synthesis returned no usable content. Try ending again.");
  }

  await setSessionStatus(parsed.sessionId, "ended", {
    summary: out.summary || "Session ended; synthesis ready for review.",
    proposedVoiceProfile: out.voice || voice,
    proposedKnowledge: out.knowledge || knowledge,
  });

  return Response.json({ ok: true, sessionId: parsed.sessionId });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
