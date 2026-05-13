import "server-only";
import { generateText } from "ai";
import { getModel } from "@/lib/llm";
import type { Provider } from "@/lib/types";

/**
 * Sends a one-token request to confirm the key works. Per the Phase 4
 * acceptance criterion: "test and continue". Cheap, fast, real.
 * Returns null on success, a short error string on failure.
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
      maxTokens: 1,
    });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Unknown provider error";
  }
}
