import "server-only";
import { sql } from "@vercel/postgres";
import type { InterviewStatus } from "@/lib/db/schema";

export const DIMENSIONS = [
  "background",
  "expertise",
  "opinions",
  "audience",
  "recent_work",
  "anti_patterns",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  background: "Background",
  expertise: "Expertise",
  opinions: "Strong opinions",
  audience: "Audience",
  recent_work: "Recent work",
  anti_patterns: "Anti-patterns",
};

export const DIMENSION_PROMPT: Record<Dimension, string> = {
  background: "Who you are, your role, and what you actually do day to day.",
  expertise: "Where you've earned the right to an opinion (years, scope, scars).",
  opinions: "Strong or contrarian views you hold; conventional wisdom you reject.",
  audience: "Who you are writing for; what they care about; what they'd skip past.",
  recent_work: "What you're working on right now; what's changed recently.",
  anti_patterns: "Patterns you've seen go wrong; mistakes others should avoid.",
};

export type SessionRow = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  status: InterviewStatus;
  questionsCount: number;
  summary: string | null;
};

export type QaRow = {
  id: string;
  sessionId: string;
  position: number;
  dimension: Dimension | null;
  question: string;
  answer: string | null;
  askedAt: string;
  answeredAt: string | null;
};

export type SessionDetail = SessionRow & {
  qa: QaRow[];
  proposedVoiceProfile: string | null;
  proposedKnowledge: string | null;
};

function parseDimension(s: string | null): Dimension | null {
  if (!s) return null;
  return (DIMENSIONS as readonly string[]).includes(s) ? (s as Dimension) : null;
}

export async function listSessions(limit = 20): Promise<SessionRow[]> {
  const rows = await sql<{
    id: string;
    started_at: string;
    ended_at: string | null;
    status: InterviewStatus;
    questions_count: number;
    summary: string | null;
  }>`
    SELECT id::text, started_at::text, ended_at::text, status,
           questions_count, summary
    FROM interview_sessions
    ORDER BY started_at DESC
    LIMIT ${limit}
  `;
  return rows.rows.map((r) => ({
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    status: r.status,
    questionsCount: r.questions_count,
    summary: r.summary,
  }));
}

export async function getSessionDetail(id: string): Promise<SessionDetail | null> {
  const sessRows = await sql<{
    id: string;
    started_at: string;
    ended_at: string | null;
    status: InterviewStatus;
    questions_count: number;
    summary: string | null;
    proposed_voice_profile: string | null;
    proposed_knowledge: string | null;
  }>`
    SELECT id::text, started_at::text, ended_at::text, status,
           questions_count, summary,
           proposed_voice_profile, proposed_knowledge
    FROM interview_sessions
    WHERE id = ${id}::uuid
    LIMIT 1
  `;
  const s = sessRows.rows[0];
  if (!s) return null;

  const qaRows = await sql<{
    id: string;
    session_id: string;
    position: number;
    dimension: string | null;
    question: string;
    answer: string | null;
    asked_at: string;
    answered_at: string | null;
  }>`
    SELECT id::text, session_id::text, position, dimension, question, answer,
           asked_at::text, answered_at::text
    FROM interview_qa
    WHERE session_id = ${id}::uuid
    ORDER BY position ASC
  `;

  return {
    id: s.id,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    status: s.status,
    questionsCount: s.questions_count,
    summary: s.summary,
    proposedVoiceProfile: s.proposed_voice_profile,
    proposedKnowledge: s.proposed_knowledge,
    qa: qaRows.rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      position: r.position,
      dimension: parseDimension(r.dimension),
      question: r.question,
      answer: r.answer,
      askedAt: r.asked_at,
      answeredAt: r.answered_at,
    })),
  };
}

export async function createSession(): Promise<string> {
  const res = await sql<{ id: string }>`
    INSERT INTO interview_sessions (status)
    VALUES ('active')
    RETURNING id::text
  `;
  return res.rows[0]!.id;
}

export async function appendQuestion(args: {
  sessionId: string;
  position: number;
  dimension: Dimension | null;
  question: string;
}): Promise<string> {
  const res = await sql<{ id: string }>`
    INSERT INTO interview_qa (session_id, position, dimension, question)
    VALUES (${args.sessionId}::uuid, ${args.position}, ${args.dimension ?? null}, ${args.question})
    RETURNING id::text
  `;
  await sql`
    UPDATE interview_sessions
    SET questions_count = ${args.position}
    WHERE id = ${args.sessionId}::uuid
  `;
  return res.rows[0]!.id;
}

export async function recordAnswer(qaId: string, answer: string): Promise<void> {
  await sql`
    UPDATE interview_qa
    SET answer = ${answer}, answered_at = now()
    WHERE id = ${qaId}::uuid
  `;
}

export async function setSessionStatus(
  id: string,
  status: InterviewStatus,
  patch?: { summary?: string; proposedVoiceProfile?: string; proposedKnowledge?: string },
): Promise<void> {
  await sql`
    UPDATE interview_sessions
    SET status = ${status},
        ended_at = CASE WHEN ${status} IN ('ended', 'applied', 'cancelled') THEN COALESCE(ended_at, now()) ELSE ended_at END,
        summary = COALESCE(${patch?.summary ?? null}, summary),
        proposed_voice_profile = COALESCE(${patch?.proposedVoiceProfile ?? null}, proposed_voice_profile),
        proposed_knowledge = COALESCE(${patch?.proposedKnowledge ?? null}, proposed_knowledge)
    WHERE id = ${id}::uuid
  `;
}

export function dimensionCoverage(qa: QaRow[]): Record<Dimension, number> {
  const out = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>;
  for (const row of qa) {
    if (row.dimension && row.answer) {
      out[row.dimension] = (out[row.dimension] ?? 0) + 1;
    }
  }
  return out;
}

export function nextLikelyDimension(coverage: Record<Dimension, number>): Dimension {
  // Pick the under-covered dimension with the lowest count, preferring earlier
  // dimensions on ties so the first session walks roughly in order.
  let best: Dimension = DIMENSIONS[0];
  let bestCount = Infinity;
  for (const d of DIMENSIONS) {
    if (coverage[d] < bestCount) {
      bestCount = coverage[d];
      best = d;
    }
  }
  return best;
}
