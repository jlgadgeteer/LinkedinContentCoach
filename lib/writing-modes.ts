import "server-only";
import { sql } from "@vercel/postgres";
import { safeQuery } from "@/lib/db/safe-query";

export type WritingMode = {
  id: string;
  slug: string;
  name: string;
  markdown: string;
  position: number;
};

export async function listWritingModes(): Promise<WritingMode[]> {
  return safeQuery(
    async () => {
      const rows = await sql<{
        id: string;
        slug: string;
        name: string;
        markdown: string;
        position: number;
      }>`
        SELECT id::text, slug, name, markdown, position
        FROM writing_modes
        ORDER BY position ASC, name ASC
      `;
      return rows.rows;
    },
    [] as WritingMode[],
    "writing_modes.list",
  );
}

export async function getWritingModeBySlug(slug: string): Promise<WritingMode | null> {
  return safeQuery(
    async () => {
      const rows = await sql<{
        id: string;
        slug: string;
        name: string;
        markdown: string;
        position: number;
      }>`
        SELECT id::text, slug, name, markdown, position
        FROM writing_modes
        WHERE slug = ${slug}
        LIMIT 1
      `;
      return rows.rows[0] ?? null;
    },
    null,
    "writing_modes.by_slug",
  );
}

export async function createWritingMode(args: {
  slug: string;
  name: string;
  markdown: string;
}): Promise<string> {
  const res = await sql<{ id: string }>`
    INSERT INTO writing_modes (slug, name, markdown, position)
    VALUES (
      ${args.slug},
      ${args.name},
      ${args.markdown},
      COALESCE((SELECT MAX(position) + 1 FROM writing_modes), 0)
    )
    RETURNING id::text
  `;
  return res.rows[0]!.id;
}

export async function updateWritingMode(args: {
  id: string;
  name: string;
  markdown: string;
}): Promise<void> {
  await sql`
    UPDATE writing_modes
    SET name = ${args.name}, markdown = ${args.markdown}, updated_at = now()
    WHERE id = ${args.id}::uuid
  `;
}

export async function deleteWritingMode(id: string): Promise<void> {
  await sql`DELETE FROM writing_modes WHERE id = ${id}::uuid`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
