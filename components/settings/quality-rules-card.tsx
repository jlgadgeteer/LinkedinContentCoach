"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  saveQualityRulesAction,
  resetQualityRulesAction,
  initialCardState,
  type CardState,
} from "@/lib/quality-actions";

const initial: CardState = initialCardState;

export function QualityRulesCard({ initial: initialMarkdown }: { initial: string }) {
  const [value, setValue] = useState<string>(initialMarkdown);
  const [state, action, pending] = useActionState(saveQualityRulesAction, initial);
  const lineCount = value.split("\n").length;
  const sizeKb = (new Blob([value]).size / 1024).toFixed(1);

  return (
    <section className="settings-card" aria-labelledby="card-quality">
      <div className="settings-card__head">
        <span id="card-quality" className="settings-card__title">
          Quality rules
        </span>
        <span className="eyebrow">{lineCount} lines · {sizeKb} KB</span>
      </div>
      <p className="settings-card__desc">
        AI tells, banned phrases, and structural anti-patterns. Injected into Draft (so the model
        avoids them) and Quality Check (so it grades against them). Edit freely; the defaults are a
        starting point, not a contract.
      </p>

      <form action={action}>
        <Textarea
          name="markdown"
          variant="mono"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ minHeight: 240 }}
          spellCheck={false}
        />

        {state.error ? (
          <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "var(--color-danger)" }}>
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p style={{ marginTop: 14, fontSize: 13, color: "var(--color-success)" }}>{state.ok}</p>
        ) : null}

        <div className="settings-card__foot">
          <form action={resetQualityRulesAction}>
            <button type="submit" className="btn btn--ghost btn--sm">
              Reset to defaults
            </button>
          </form>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" type="button" onClick={() => setValue(initialMarkdown)}>
              Revert
            </Button>
            <Button variant="primary" type="submit" streaming={pending} streamingLabel="Saving">
              Save rules
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
