"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { auth } from "@/lib/auth";
import { getSessionDetail, setSessionStatus } from "@/lib/interview";
import { setKnowledgeMarkdown } from "@/lib/knowledge";

async function requireUser(): Promise<void> {
  const sess = await auth();
  if (!sess?.user) throw new Error("Unauthorized");
}

export async function applyInterviewSynthesisAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id")?.toString();
  if (!id) return;
  const detail = await getSessionDetail(id);
  if (!detail) return;
  if (detail.status !== "ended") return;

  if (detail.proposedVoiceProfile && detail.proposedVoiceProfile.trim().length > 0) {
    await sql`
      INSERT INTO voice_profile (id, markdown, updated_at)
      VALUES (1, ${detail.proposedVoiceProfile}, now())
      ON CONFLICT (id) DO UPDATE
        SET markdown = EXCLUDED.markdown, updated_at = now()
    `;
  }
  if (detail.proposedKnowledge && detail.proposedKnowledge.trim().length > 0) {
    await setKnowledgeMarkdown(detail.proposedKnowledge);
  }

  await setSessionStatus(id, "applied");
  revalidatePath("/interview");
  revalidatePath(`/interview/${id}`);
  revalidatePath(`/interview/${id}/summary`);
  revalidatePath("/settings");
  revalidatePath("/");
  redirect(`/interview/${id}/summary?applied=1`);
}

export async function discardInterviewSynthesisAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await setSessionStatus(id, "cancelled", { summary: "Synthesis discarded." });
  revalidatePath("/interview");
  redirect("/interview");
}

export async function cancelInterviewSessionAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await setSessionStatus(id, "cancelled", { summary: "Cancelled by user." });
  revalidatePath("/interview");
  redirect("/interview");
}

export type KnowledgeCardState = { error: string | null; ok: string | null };

export async function saveKnowledgeAction(
  _prev: KnowledgeCardState,
  formData: FormData,
): Promise<KnowledgeCardState> {
  await requireUser();
  const md = (formData.get("markdown") ?? "").toString();
  await setKnowledgeMarkdown(md);
  revalidatePath("/settings");
  return { error: null, ok: "Knowledge saved." };
}
