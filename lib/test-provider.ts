import "server-only";
import { generateText } from "ai";
import { getModel } from "@/lib/llm";
import type { Provider } from "@/lib/types";

/**
 * Sends a small request to confirm the key works. Per the Phase 4
 * acceptance criterion: "test and continue". Cheap, fast, real.
 * Returns null on success, a short error string on failure.
 *
 * The token budget needs to be high enough that newer reasoning models
 * (GPT-5 family, o3, o4-mini) have room for internal reasoning tokens
 * BEFORE the output. With a tiny budget the API errors with
 * "max_tokens reached", which is auth-success but probe-failure noise
 * we'd rather avoid surfacing.
 */
export async function testProvider(args: {
  provider: Provider;
  model: string;
  apiKey: string;
}): Promise<string | null> {
  try {
    const model = getModel(args);
    await generateText({
      model,
      prompt: "Reply with the single word: ok",
      maxTokens: 256,
    });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Unknown provider error";
  }
}
