"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveVoiceSettingsAction, type CardState } from "@/lib/settings-actions";

const initial: CardState = { error: null, ok: null };

export function VoiceCard({ initial: initialMarkdown }: { initial: string }) {
  const [value, setValue] = useState<string>(initialMarkdown);
  const [state, action, pending] = useActionState(saveVoiceSettingsAction, initial);
  const lineCount = value.split("\n").length;
  const sizeKb = (new Blob([value]).size / 1024).toFixed(1);

  return (
    <section className="settings-card" aria-labelledby="card-voice">
      <div className="settings-card__head">
        <span id="card-voice" className="settings-card__title">
          Voice profile
        </span>
        <span className="eyebrow">{lineCount} lines · {sizeKb} KB</span>
      </div>
      <p className="settings-card__desc">
        Plain markdown. The model reads it before every action and tries hard not to drift.
      </p>

      <form action={action}>
        <Textarea
          name="markdown"
          variant="mono"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ minHeight: 180 }}
          spellCheck={false}
        />

        {state.error && (
          <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "var(--color-danger)" }}>
            {state.error}
          </p>
        )}
        {state.ok && (
          <p style={{ marginTop: 14, fontSize: 13, color: "var(--color-success)" }}>{state.ok}</p>
        )}

        <div className="settings-card__foot">
          <span className="eyebrow">Saves on submit</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setValue(initialMarkdown)}
            >
              Revert
            </Button>
            <Button
              variant="primary"
              type="submit"
              streaming={pending}
              streamingLabel="Saving"
            >
              Save voice
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
