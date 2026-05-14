// Shared model catalogs for both the Provider card and the Per-action
// parameters card. Pure data, safe to import from client components.
//
// IMPORTANT: We only list models that work via the OpenAI Chat Completions
// endpoint (v1/chat/completions). OpenAI exposes some "pro" and reasoning
// variants (gpt-5.5-pro, gpt-5.4-pro) only through the newer Responses API
// (v1/responses) and the @ai-sdk/openai client we use defaults to chat
// completions, so those models will return "not a chat model" errors and
// are intentionally omitted. The "Custom model ID..." escape hatch lets
// power users paste any ID; just be prepared for a Responses-only ID to
// fail at Test connection time.

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
    // Chat-completions-compatible flagship line.
    { id: "gpt-5.5", label: "GPT-5.5 (recommended default)" },
    // Current cost-tier family.
    { id: "gpt-5.4", label: "GPT-5.4 (balanced)" },
    { id: "gpt-5.4-mini", label: "GPT-5.4 mini (faster, cheaper)" },
    { id: "gpt-5.4-nano", label: "GPT-5.4 nano (cheapest)" },
    // Previous flagship.
    { id: "gpt-5", label: "GPT-5 (previous flagship)" },
    // Reasoning variants that go through chat completions.
    { id: "o3", label: "o3 (deep reasoning)" },
    { id: "o4-mini", label: "o4-mini (cheaper reasoning)" },
    // Older GPT-4 family.
    { id: "gpt-4.1", label: "GPT-4.1 (legacy general)" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini (legacy cheap)" },
    { id: "gpt-4o", label: "GPT-4o (older general)" },
    { id: "gpt-4o-mini", label: "GPT-4o mini (older cheap)" },
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
