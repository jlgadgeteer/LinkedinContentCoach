// Shared types used across client and server.

export type Action = "draft" | "ideate" | "search" | "check" | "revise";

export type Provider = "anthropic" | "openai";

export type ProviderModel = {
  provider: Provider;
  model: string;
};

export const MODEL_OPTIONS: Record<Provider, { id: string; label: string }[]> = {
  anthropic: [
    { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
};

export type Post = {
  id: string;
  date: string;
  url: string;
  hook: string;
  text: string;
  wordCount: number;
  createdAt: number;
};

export type Settings = {
  id: "default";
  provider: Provider;
  model: string;
  apiKey: string;
  // The voice profile is stored separately; this is just a pointer for which one is active.
  voiceProfileId: "default";
};

export type VoiceProfile = {
  id: "default";
  markdown: string;
  updatedAt: number;
};

// Wire types for the /api/generate endpoint.

export type GenerateRequest = {
  action: Action;
  topic?: string;
  draft?: string; // for "check" action
  query?: string; // for "search" action
  posts: Post[];
  voiceProfile: string; // markdown
  provider: Provider;
  model: string;
  apiKey: string;
};

export type GenerateRequestSchemaShape = GenerateRequest; // for runtime validators
