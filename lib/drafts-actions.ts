"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { auth } from "@/lib/auth";

export type DraftActionState = { error: string | null; ok: string | null };

const initial: DraftActionState = { error: null, ok: null };

async function requireUser(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

const StatusUpdate = z.object({
  id: z.string().uuid(),
  status: z.enum(["not_published", "scheduled", "published"]),
});

export async function updateDraftStatusAction(
  _prev: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  await requireUser();
  const parsed = StatusUpdate.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Pick a status.", ok: null };

  // Setting to scheduled without a scheduled_for clears any previous date
  // implicitly; setting to not_published or published clears it too.
  if (parsed.data.status === "not_published" || parsed.data.status === "published") {
    await sql`
      UPDATE drafts
      SET status = ${parsed.data.status}, scheduled_for = NULL, updated_at = now()
      WHERE id = ${parsed.data.id}::uuid
    `;
  } else {
    await sql`
      UPDATE drafts
      SET status = ${parsed.data.status}, updated_at = now()
      WHERE id = ${parsed.data.id}::uuid
    `;
  }
  revalidatePath("/drafts");
  revalidatePath(`/drafts/${parsed.data.id}`);
  revalidatePath("/calendar");
  revalidatePath("/");
  return { error: null, ok: "Status updated." };
}

const Schedule = z.object({
  id: z.string().uuid(),
  scheduledFor: z.string().optional(),
});

export async function setDraftScheduleAction(
  _prev: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  await requireUser();
  const parsed = Schedule.safeParse({
    id: formData.get("id"),
    scheduledFor: formData.get("scheduledFor")?.toString() || undefined,
  });
  if (!parsed.success) return { error: "Invalid input.", ok: null };

  const value = parsed.data.scheduledFor?.trim();
  if (!value) {
    await sql`
      UPDATE drafts
      SET scheduled_for = NULL,
          status = CASE WHEN status = 'scheduled' THEN 'not_published' ELSE status END,
          updated_at = now()
      WHERE id = ${parsed.data.id}::uuid
    `;
  } else {
    // datetime-local input gives a naive local string (YYYY-MM-DDTHH:mm).
    // Postgres' timestamptz cast will interpret it in the DB session's TZ,
    // which is fine for a single-user instance. We still flip status so the
    // calendar reflects intent.
    await sql`
      UPDATE drafts
      SET scheduled_for = ${value}::timestamp,
          status = 'scheduled',
          updated_at = now()
      WHERE id = ${parsed.data.id}::uuid
    `;
  }
  revalidatePath("/drafts");
  revalidatePath(`/drafts/${parsed.data.id}`);
  revalidatePath("/calendar");
  revalidatePath("/");
  return { error: null, ok: value ? "Scheduled." : "Unscheduled." };
}

const BodyEdit = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

export async function updateDraftBodyAction(
  _prev: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  await requireUser();
  const parsed = BodyEdit.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Title and body are both required.", ok: null };
  await sql`
    UPDATE drafts
    SET title = ${parsed.data.title}, body = ${parsed.data.body}, updated_at = now()
    WHERE id = ${parsed.data.id}::uuid
  `;
  revalidatePath("/drafts");
  revalidatePath(`/drafts/${parsed.data.id}`);
  return { error: null, ok: "Saved." };
}

export async function deleteDraftAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await sql`DELETE FROM drafts WHERE id = ${id}::uuid`;
  revalidatePath("/drafts");
  revalidatePath("/calendar");
  revalidatePath("/");
  redirect("/drafts");
}

export { initial as initialDraftActionState };
