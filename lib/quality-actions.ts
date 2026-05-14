"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isMissingRelationOrColumn } from "@/lib/db/safe-query";
import { setQualityRulesMarkdown, DEFAULT_QUALITY_RULES } from "@/lib/quality-rules";
import {
  createWritingMode,
  deleteWritingMode,
  slugify,
  updateWritingMode,
} from "@/lib/writing-modes";
import {
  getActionSettings,
  setActionSettings,
  type ActionKey,
  type ActionSettings,
} from "@/lib/action-settings";

export type CardState = { error: string | null; ok: string | null };
const initial: CardState = { error: null, ok: null };

async function requireUser(): Promise<void> {
  const sess = await auth();
  if (!sess?.user) throw new Error("Unauthorized");
}

function friendlyError(err: unknown, fallback: string): string {
  if (isMissingRelationOrColumn(err)) {
    return (
      "The database schema looks out of date. Open Settings → Backup → Run schema check, " +
      "then try again."
    );
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function saveQualityRulesAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  try {
    await requireUser();
    const md = (formData.get("markdown") ?? "").toString();
    await setQualityRulesMarkdown(md);
    revalidatePath("/settings");
    return { error: null, ok: "Quality rules saved." };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[content-coach] saveQualityRulesAction failed", err);
    return { error: friendlyError(err, "Couldn't save quality rules."), ok: null };
  }
}

export async function resetQualityRulesAction(): Promise<void> {
  await requireUser();
  await setQualityRulesMarkdown(DEFAULT_QUALITY_RULES);
  revalidatePath("/settings");
  redirect("/settings");
}

const ModeCreate = z.object({
  name: z.string().min(2).max(60),
  markdown: z.string().min(1).max(20000),
});

export async function createWritingModeAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  try {
    await requireUser();
    const parsed = ModeCreate.safeParse({
      name: formData.get("name"),
      markdown: formData.get("markdown"),
    });
    if (!parsed.success) return { error: "Name (2-60 chars) and markdown body required.", ok: null };
    const slug = slugify(parsed.data.name);
    if (!slug) return { error: "Name must contain at least one alphanumeric character.", ok: null };
    try {
      await createWritingMode({ slug, name: parsed.data.name, markdown: parsed.data.markdown });
    } catch (innerErr) {
      if (isMissingRelationOrColumn(innerErr)) {
        return { error: friendlyError(innerErr, "Couldn't create mode."), ok: null };
      }
      return { error: "A mode with that name (or slug) already exists.", ok: null };
    }
    revalidatePath("/settings");
    revalidatePath("/draft");
    return { error: null, ok: "Mode created." };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[content-coach] createWritingModeAction failed", err);
    return { error: friendlyError(err, "Couldn't create mode."), ok: null };
  }
}

const ModeUpdate = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(60),
  markdown: z.string().min(1).max(20000),
});

export async function updateWritingModeAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  try {
    await requireUser();
    const parsed = ModeUpdate.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      markdown: formData.get("markdown"),
    });
    if (!parsed.success) return { error: "Invalid input.", ok: null };
    await updateWritingMode(parsed.data);
    revalidatePath("/settings");
    revalidatePath("/draft");
    return { error: null, ok: "Mode updated." };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[content-coach] updateWritingModeAction failed", err);
    return { error: friendlyError(err, "Couldn't update mode."), ok: null };
  }
}

export async function deleteWritingModeAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await deleteWritingMode(id);
  revalidatePath("/settings");
  revalidatePath("/draft");
  redirect("/settings");
}

const ACTION_KEYS: ActionKey[] = ["draft", "revise", "ideate", "search", "check"];

export async function saveActionSettingsAction(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  try {
    await requireUser();
    const next: ActionSettings = { ...(await getActionSettings()) };
    for (const k of ACTION_KEYS) {
      const tempStr = formData.get(`${k}_temperature`)?.toString().trim() ?? "";
      const modelStr = formData.get(`${k}_model`)?.toString().trim() ?? "";
      const params: { temperature?: number; model?: string } = {};
      if (tempStr) {
        const n = Number(tempStr);
        if (!Number.isFinite(n) || n < 0 || n > 2) {
          return { error: `Temperature for ${k} must be between 0 and 2.`, ok: null };
        }
        params.temperature = n;
      }
      if (modelStr) {
        params.model = modelStr;
      }
      if (Object.keys(params).length === 0) {
        delete next[k];
      } else {
        next[k] = params;
      }
    }
    await setActionSettings(next);
    revalidatePath("/settings");
    return { error: null, ok: "Action settings saved." };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[content-coach] saveActionSettingsAction failed", err);
    return { error: friendlyError(err, "Couldn't save action settings."), ok: null };
  }
}

export { initial as initialCardState };
