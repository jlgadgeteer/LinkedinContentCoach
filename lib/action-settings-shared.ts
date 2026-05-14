// Pure constants + types for per-action params. Safe to import from client
// components. Server-only DB helpers live in lib/action-settings.ts.

export type ActionKey = "draft" | "ideate" | "search" | "check" | "revise";

export type ActionParams = {
  temperature?: number;
  model?: string;
};

export type ActionSettings = Partial<Record<ActionKey, ActionParams>>;

export const DEFAULT_TEMPERATURE: Record<ActionKey, number> = {
  draft: 0.8,
  ideate: 0.6,
  search: 0.6,
  check: 0.6,
  revise: 0.8,
};
