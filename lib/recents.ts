import "server-only";
import { sql } from "@vercel/postgres";

export type RecentDetail = {
  id: number;
  at: string;
  kind: string;
  title: string;
  action: "draft" | "ideate" | "search" | "check" | null;
  inputTopic: string | null;
  inputDraft: string | null;
  inputQuery: string | null;
  output: string | null;
  draftId: string | null;
};

const ACTION_BY_KIND: Record<string, RecentDetail["action"]> = {
  DRAFT: "draft",
  IDEATE: "ideate",
  SEARCH: "search",
  QC: "check",
};

export async function getRecentById(id: number): Promise<RecentDetail | null> {
  const rows = await sql<{
    id: number;
    at: string;
    kind: string;
    title: string;
    action: string | null;
    input_topic: string | null;
    input_draft: string | null;
    input_query: string | null;
    output: string | null;
    draft_id: string | null;
  }>`
    SELECT id, at::text AS at, kind, title, action,
           input_topic, input_draft, input_query, output, draft_id::text AS draft_id
    FROM recent_actions
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows.rows[0];
  if (!row) return null;
  const action = (row.action ?? ACTION_BY_KIND[row.kind] ?? null) as RecentDetail["action"];
  return {
    id: row.id,
    at: row.at,
    kind: row.kind,
    title: row.title,
    action,
    inputTopic: row.input_topic,
    inputDraft: row.input_draft,
    inputQuery: row.input_query,
    output: row.output,
    draftId: row.draft_id,
  };
}

export function resumeHref(detail: RecentDetail): string {
  if (detail.action === "draft") {
    const t = detail.inputTopic ?? "";
    return `/draft?topic=${encodeURIComponent(t)}`;
  }
  if (detail.action === "ideate") {
    const t = detail.inputTopic ?? "";
    return `/ideate?topic=${encodeURIComponent(t)}`;
  }
  if (detail.action === "search") {
    const q = detail.inputQuery ?? "";
    return `/search?query=${encodeURIComponent(q)}`;
  }
  if (detail.action === "check") {
    const d = detail.inputDraft ?? "";
    return `/quality-check?draft=${encodeURIComponent(d)}`;
  }
  return "/";
}
