import "server-only";
import { sql } from "@vercel/postgres";
import type { DraftStatus } from "@/lib/db/schema";
import { safeQuery } from "@/lib/db/safe-query";

export type DraftSummary = {
  id: string;
  title: string;
  topic: string | null;
  excerpt: string;
  status: DraftStatus;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DraftFull = DraftSummary & { body: string };

const VALID_STATUS: ReadonlySet<DraftStatus> = new Set([
  "not_published",
  "scheduled",
  "published",
]);

export function isDraftStatus(s: string): s is DraftStatus {
  return VALID_STATUS.has(s as DraftStatus);
}

export function excerptFromBody(body: string, n = 160): string {
  const stripped = body.replace(/<\/?post>/gi, "").trim();
  if (stripped.length <= n) return stripped;
  return stripped.slice(0, n - 1).trimEnd() + "…";
}

export async function listDrafts(): Promise<DraftSummary[]> {
  return safeQuery(
    async () => {
      const rows = await sql<{
        id: string;
        title: string;
        topic: string | null;
        body: string;
        status: DraftStatus;
        scheduled_for: string | null;
        created_at: string;
        updated_at: string;
      }>`
        SELECT id::text, title, topic, body, status,
               scheduled_for::text AS scheduled_for,
               created_at::text AS created_at,
               updated_at::text AS updated_at
        FROM drafts
        ORDER BY
          CASE status WHEN 'scheduled' THEN 0 WHEN 'not_published' THEN 1 ELSE 2 END,
          COALESCE(scheduled_for, updated_at) DESC
      `;
      return rows.rows.map((r) => ({
        id: r.id,
        title: r.title,
        topic: r.topic,
        excerpt: excerptFromBody(r.body),
        status: r.status,
        scheduledFor: r.scheduled_for,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    },
    [] as DraftSummary[],
    "drafts.list",
  );
}

export async function getDraftById(id: string): Promise<DraftFull | null> {
  return safeQuery(
    async () => {
      const rows = await sql<{
        id: string;
        title: string;
        topic: string | null;
        body: string;
        status: DraftStatus;
        scheduled_for: string | null;
        created_at: string;
        updated_at: string;
      }>`
        SELECT id::text, title, topic, body, status,
               scheduled_for::text AS scheduled_for,
               created_at::text AS created_at,
               updated_at::text AS updated_at
        FROM drafts
        WHERE id = ${id}::uuid
        LIMIT 1
      `;
      const r = rows.rows[0];
      if (!r) return null;
      return {
        id: r.id,
        title: r.title,
        topic: r.topic,
        body: r.body,
        excerpt: excerptFromBody(r.body),
        status: r.status,
        scheduledFor: r.scheduled_for,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    },
    null,
    "drafts.by_id",
  );
}

export async function listDraftsInRange(
  startIso: string,
  endIso: string,
): Promise<DraftSummary[]> {
  return safeQuery(
    async () => {
      const rows = await sql<{
        id: string;
        title: string;
        topic: string | null;
        body: string;
        status: DraftStatus;
        scheduled_for: string | null;
        created_at: string;
        updated_at: string;
      }>`
        SELECT id::text, title, topic, body, status,
               scheduled_for::text AS scheduled_for,
               created_at::text AS created_at,
               updated_at::text AS updated_at
        FROM drafts
        WHERE scheduled_for IS NOT NULL
          AND scheduled_for >= ${startIso}::timestamptz
          AND scheduled_for <  ${endIso}::timestamptz
        ORDER BY scheduled_for ASC
      `;
      return _shapeRowsForRange(rows.rows);
    },
    [] as DraftSummary[],
    "drafts.in_range",
  );
}

function _shapeRowsForRange(rows: Array<{
  id: string;
  title: string;
  topic: string | null;
  body: string;
  status: DraftStatus;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}>): DraftSummary[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    topic: r.topic,
    excerpt: excerptFromBody(r.body),
    status: r.status,
    scheduledFor: r.scheduled_for,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * Extract the body of the first <post> block, falling back to the raw text.
 * Used to peel formatting marks off a streamed draft before persisting.
 */
export function extractPostBody(streamed: string): string {
  const match = streamed.match(/<post>([\s\S]*?)<\/post>/i);
  if (match) return match[1]!.trim();
  return streamed.trim();
}

export function titleFromBody(body: string, fallback: string): string {
  const firstLine = body.split(/\n/).map((s) => s.trim()).find(Boolean);
  if (!firstLine) return fallback;
  if (firstLine.length > 80) return firstLine.slice(0, 77).trimEnd() + "…";
  return firstLine;
}
