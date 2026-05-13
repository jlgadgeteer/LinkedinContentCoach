import "server-only";
import { sql } from "@vercel/postgres";

export type RecentRow = {
  id: number;
  at: string;
  kind: string;
  title: string;
  ref: string | null;
};

export type WorkspaceSummary = {
  postCount: number;
  hasVoiceProfile: boolean;
  recent: RecentRow[];
};

export async function getWorkspaceSummary(limit = 8): Promise<WorkspaceSummary> {
  const postCount = await sql<{ count: number }>`SELECT COUNT(*)::int AS count FROM posts`;
  const voice = await sql<{ markdown: string }>`SELECT markdown FROM voice_profile WHERE id = 1 LIMIT 1`;
  const recent = await sql<RecentRow>`
    SELECT id, at::text AS at, kind, title, ref
    FROM recent_actions
    ORDER BY at DESC
    LIMIT ${limit}
  `;

  return {
    postCount: postCount.rows[0]?.count ?? 0,
    hasVoiceProfile: !!(voice.rows[0]?.markdown && voice.rows[0].markdown.trim().length > 0),
    recent: recent.rows,
  };
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.round(day / 30);
  return `${mo}mo ago`;
}
