"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  finishWithoutPostsAction,
  savePostsAndFinishAction,
  type ActionState,
} from "@/lib/setup-actions";

const initial: ActionState = { error: null };

type Detected =
  | { kind: "empty" }
  | { kind: "invalid"; reason: string }
  | { kind: "ok"; count: number; oldest: string | null; newest: string | null };

function detect(raw: string): Detected {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { kind: "invalid", reason: "Not valid JSON yet" };
  }
  if (!Array.isArray(parsed)) {
    return { kind: "invalid", reason: "Top-level should be an array" };
  }
  let oldest: string | null = null;
  let newest: string | null = null;
  for (const item of parsed) {
    const obj = item as { date?: unknown; published_at?: unknown };
    const d = (obj.published_at ?? obj.date) as string | undefined;
    if (typeof d === "string" && d.length >= 8) {
      if (!oldest || d < oldest) oldest = d;
      if (!newest || d > newest) newest = d;
    }
  }
  return { kind: "ok", count: parsed.length, oldest, newest };
}

export function StepPostsForm() {
  const [state, action, pending] = useActionState(savePostsAndFinishAction, initial);
  const [value, setValue] = useState<string>("");

  const detected = useMemo(() => detect(value), [value]);

  return (
    <form action={action} noValidate>
      <Label htmlFor="posts" hint="JSON · array of posts">
        Post corpus
      </Label>
      <Textarea
        id="posts"
        name="posts"
        variant="mono"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`[\n  { "date": "2024-09-12", "text": "Most pilots stall...", "hook": "...", "url": "..." }\n]`}
        style={{ minHeight: 280 }}
        spellCheck={false}
      />
      <p className="help">
        {detected.kind === "empty" && "Paste your LinkedIn post export. Skip if you don't have one yet."}
        {detected.kind === "invalid" && detected.reason}
        {detected.kind === "ok" &&
          `Detected: ${detected.count} post${detected.count === 1 ? "" : "s"}.` +
            (detected.oldest && detected.newest
              ? ` Oldest ${detected.oldest}. Newest ${detected.newest}.`
              : "")}
      </p>

      {state.error && (
        <p
          role="alert"
          style={{ marginTop: 16, fontSize: 13, color: "var(--color-danger)" }}
        >
          {state.error}
        </p>
      )}

      <div className="wizard__foot">
        <Button
          type="submit"
          formAction={finishWithoutPostsAction}
          variant="ghost"
        >
          Skip this step
        </Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/setup?step=2" className="btn btn--secondary">
            Back
          </Link>
          <Button
            variant="primary"
            type="submit"
            streaming={pending}
            streamingLabel="Finishing"
          >
            Finish setup
          </Button>
        </div>
      </div>
    </form>
  );
}
