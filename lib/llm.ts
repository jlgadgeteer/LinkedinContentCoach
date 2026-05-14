// LLM provider abstraction. Uses the Vercel AI SDK so swapping providers is
// a one-line change. The user's API key is passed in per-request from the
// browser; we never persist it server-side.

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type LanguageModel } from "ai";
import type { Provider } from "./types";

export function getModel(args: {
  provider: Provider;
  model: string;
  apiKey: string;
}): LanguageModel {
  switch (args.provider) {
    case "anthropic": {
      const client = createAnthropic({ apiKey: args.apiKey });
      return client(args.model);
    }
    case "openai": {
      const client = createOpenAI({ apiKey: args.apiKey });
      return client(args.model);
    }
  }
}

export async function streamCompletion(args: {
  provider: Provider;
  model: string;
  apiKey: string;
  system: string;
  user: string;
  temperature?: number;
  onFinish?: (final: { text: string }) => void | Promise<void>;
}) {
  const model = getModel({
    provider: args.provider,
    model: args.model,
    apiKey: args.apiKey,
  });

  return streamText({
    model,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
    temperature: args.temperature ?? 0.7,
    onFinish: args.onFinish
      ? async ({ text }) => {
          await args.onFinish!({ text });
        }
      : undefined,
  });
}
