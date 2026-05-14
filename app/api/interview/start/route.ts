import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { getResolvedProvider } from "@/lib/api-key";
import { generateOnce } from "@/lib/llm";
import { getVoiceProfileMarkdown } from "@/lib/posts";
import { getKnowledgeMarkdown } from "@/lib/knowledge";
import {
  appendQuestion,
  createSession,
  dimensionCoverage,
  nextLikelyDimension,
} from "@/lib/interview";
import { INTERVIEW_QUESTION_SKILL } from "@/lib/prompts/skills";
import { buildQuestionUserMessage, parseQuestion } from "@/lib/interview-prompt";

const { auth } = NextAuth(authConfig);

export const runtime = "edge";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return jsonError(401, "Unauthorized");
  }

  const provider = await getResolvedProvider();
  if (!provider) return jsonError(412, "Configure a provider in Settings before starting an interview.");

  const [voice, knowledge] = await Promise.all([
    getVoiceProfileMarkdown(),
    getKnowledgeMarkdown(),
  ]);
  const isFirstSession = knowledge.trim().length === 0;
  const coverage = dimensionCoverage([]);
  const preferredDimension = nextLikelyDimension(coverage);

  const userMsg = buildQuestionUserMessage({
    qa: [],
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

  const parsed = parseQuestion(raw);
  if (!parsed.question) return jsonError(502, "Model returned an empty question");

  const sessionId = await createSession();
  const qaId = await appendQuestion({
    sessionId,
    position: 1,
    dimension: parsed.dimension ?? preferredDimension,
    question: parsed.question,
  });

  return Response.json({
    sessionId,
    qaId,
    question: parsed.question,
    dimension: parsed.dimension ?? preferredDimension,
    position: 1,
  });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
