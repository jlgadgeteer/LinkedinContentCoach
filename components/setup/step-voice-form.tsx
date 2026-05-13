"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveVoiceProfileAction, type ActionState } from "@/lib/setup-actions";

const STARTER_VOICE_PROFILE = `# Voice

## Who I am
- Senior tech executive. I write for peers, not for an audience that needs explanations.

## What I sound like
- Direct, not breezy. No corporate filler.
- Concrete examples > abstractions. Numbers > adjectives.
- I'll start with the lede, not a wind-up.

## Common moves
- Quote a real exchange or moment, then unpack it.
- Tee up a contrarian take, then defend it with one or two examples.
- End on a question only if it earns its place.

## What I don't do
- No "I'm excited to announce..."
- No em dashes.
- No emoji, no exclamation marks.
- No phrases like "in today's fast-paced world."
`;

const initial: ActionState = { error: null };

export function StepVoiceForm({ defaultValue }: { defaultValue?: string }) {
  const [state, action, pending] = useActionState(saveVoiceProfileAction, initial);
  const [value, setValue] = useState<string>(defaultValue || STARTER_VOICE_PROFILE);

  const lineCount = value.split("\n").length;
  const sizeKb = (new Blob([value]).size / 1024).toFixed(1);

  return (
    <form action={action} noValidate>
      <Label htmlFor="markdown" hint="markdown · ~120 lines is plenty">
        Voice profile
      </Label>
      <Textarea
        id="markdown"
        name="markdown"
        variant="mono"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ minHeight: 280 }}
        spellCheck={false}
      />
      <p className="help">
        {lineCount} lines · {sizeKb} KB
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
        <Link href="/setup?step=3" className="btn btn--ghost">
          Skip this step
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/setup?step=1" className="btn btn--secondary">
            Back
          </Link>
          <Button
            variant="primary"
            type="submit"
            streaming={pending}
            streamingLabel="Saving"
          >
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
}
