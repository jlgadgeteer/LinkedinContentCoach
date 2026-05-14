import NextAuth from "next-auth";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { getResolvedProvider } from "@/lib/api-key";
import { generateOnce } from "@/lib/llm";
import { getVoiceProfileMarkdown } from "@/lib/posts";
import { getKnowledgeMarkdown } from "@/lib/knowledge";
import {
  appendQuestion,
  dimensionCoverage,
  getSessionDetail,
  nextLikelyDimension,
  recordAnswer,
} from "@/lib/interview";
import { INTERVIEW_QUESTION_SKILL } from "@/lib/prompts/skills";
import { buildQuestionUserMessage, parseQuestion } from "@/lib/interview-prompt";

const { auth } = NextAuth(authConfig);

export const runtime = "edge";

const Body = z.object({
  sessionId: z.string().uuid(),
  qaId: z.string().uuid(),
  answer: z.string().min(1).max(20000),
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

  await recordAnswer(parsed.qaId, parsed.answer);

  const detail = await getSessionDetail(parsed.sessionId);
  if (!detail) return jsonError(404, "Session not found");
  if (detail.status !== "active") return jsonError(409, "Session is no longer active");

  const provider = await getResolvedProvider();
  if (!provider) return jsonError(412, "Configure a provider before answering more questions.");

  const [voice, knowledge] = await Promise.all([
    getVoiceProfileMarkdown(),
    getKnowledgeMarkdown(),
  ]);
  const isFirstSession = knowledge.trim().length === 0;
  const coverage = dimensionCoverage(detail.qa);
  const preferredDimension = nextLikelyDimension(coverage);

  const userMsg = buildQuestionUserMessage({
    qa: detail.qa,
    coverage,
    preferredDimension,
    voiceProfile: voice,
    knowledge,
    isFirstSession,
  });

  let raw: string;
  try {
    raw = await generateOnce({
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      system: INTERVIEW_QUESTION_SKILL,
      user: userMsg,
      temperature: 0.7,
    });
  } catch (err) {
    return jsonError(502, err instanceof Error ? err.message : "Provider call failed");
  }

  const next = parseQuestion(raw);
  if (!next.question) return jsonError(502, "Model returned an empty question");

  const newPosition = detail.qa.length + 1;
  const newQaId = await appendQuestion({
    sessionId: parsed.sessionId,
    position: newPosition,
    dimension: next.dimension ?? preferredDimension,
    question: next.question,
  });

  return Response.json({
    qaId: newQaId,
    question: next.question,
    dimension: next.dimension ?? preferredDimension,
    position: newPosition,
    coverage,
  });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
