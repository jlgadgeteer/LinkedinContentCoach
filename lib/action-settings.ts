import "server-only";
import { sql } from "@vercel/postgres";
import {
  DEFAULT_TEMPERATURE,
  type ActionKey,
  type ActionParams,
  type ActionSettings,
} from "@/lib/action-settings-shared";

export { DEFAULT_TEMPERATURE };
export type { ActionKey, ActionParams, ActionSettings };

export async function getActionSettings(): Promise<ActionSettings> {
  try {
    const res = await sql<{ action_settings: unknown }>`
      SELECT action_settings FROM config WHERE id = 1 LIMIT 1
    `;
    const raw = res.rows[0]?.action_settings;
    if (!raw || typeof raw !== "object") return {};
    return raw as ActionSettings;
  } catch (err) {
    const { isMissingRelationOrColumn } = await import("@/lib/db/safe-query");
    if (isMissingRelationOrColumn(err)) {
      // eslint-disable-next-line no-console
      console.warn("[content-coach] config.action_settings missing; using defaults. Run /api/admin/migrate.");
      return {};
    }
    throw err;
  }
}

export async function setActionSettings(settings: ActionSettings): Promise<void> {
  await sql`
    INSERT INTO config (id, action_settings, updated_at)
    VALUES (1, ${JSON.stringify(settings)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE
      SET action_settings = EXCLUDED.action_settings, updated_at = now()
  `;
}

export function resolveActionParams(
  settings: ActionSettings,
  action: ActionKey,
  baseModel: string,
): { temperature: number; model: string } {
  const a = settings[action] ?? {};
  return {
    temperature:
      typeof a.temperature === "number" && a.temperature >= 0 && a.temperature <= 2
        ? a.temperature
        : DEFAULT_TEMPERATURE[action],
    model: a.model && a.model.trim().length > 0 ? a.model : baseModel,
  };
}
