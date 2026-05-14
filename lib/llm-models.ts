// Shared model catalogs for both the Provider card and the Per-action
// parameters card. Pure data, safe to import from client components.

import type { Provider } from "@/lib/types";

export type ModelChoice = { id: string; label: string };

export const MODELS: Record<Provider, ModelChoice[]> = {
  anthropic: [
    { id: "claude-opus-4-7", label: "Claude Opus 4.7 (top tier)" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (balanced)" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fast)" },
  ],
  openai: [
    // Flagship (May 2026 — per developers.openai.com/api/docs/models).
    { id: "gpt-5.5-pro", label: "GPT-5.5 pro (smartest, slowest)" },
    { id: "gpt-5.5", label: "GPT-5.5 (recommended default)" },
    // Lower-cost current generation.
    { id: "gpt-5.4-pro", label: "GPT-5.4 pro (smarter than 5.4)" },
    { id: "gpt-5.4", label: "GPT-5.4 (balanced)" },
    { id: "gpt-5.4-mini", label: "GPT-5.4 mini (faster, cheaper)" },
    { id: "gpt-5.4-nano", label: "GPT-5.4 nano (cheapest)" },
    // Previous flagship.
    { id: "gpt-5", label: "GPT-5 (previous flagship)" },
    // Reasoning.
    { id: "o3", label: "o3 (deep reasoning, legacy)" },
    { id: "o4-mini", label: "o4-mini (cheaper reasoning)" },
    // Older GPT-4 family.
    { id: "gpt-4.1", label: "GPT-4.1 (legacy general)" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini (legacy cheap)" },
    { id: "gpt-4o", label: "GPT-4o (older general)" },
    { id: "gpt-4o-mini", label: "GPT-4o mini (older cheap)" },
    // Open-weight.
    { id: "gpt-oss-120b", label: "gpt-oss-120b (open-weight)" },
    { id: "gpt-oss-20b", label: "gpt-oss-20b (open-weight)" },
  ],
};

// Standard temperature steps shown in the Per-action Temperature dropdown.
// Covers the useful range; anything outside this needs the Custom path.
export const TEMPERATURE_STEPS = [
  0.0,
  0.2,
  0.4,
  0.6,
  0.7,
  0.8,
  0.9,
  1.0,
  1.2,
  1.5,
] as const;
