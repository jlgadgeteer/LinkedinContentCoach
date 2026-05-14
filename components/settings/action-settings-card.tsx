"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  initialCardState,
  saveActionSettingsAction,
  type CardState,
} from "@/lib/quality-actions";
import {
  DEFAULT_TEMPERATURE,
  type ActionKey,
  type ActionSettings,
} from "@/lib/action-settings-shared";

const ACTION_LABEL: Record<ActionKey, string> = {
  draft: "Draft",
  ideate: "Ideate",
  search: "Search",
  check: "Quality check",
  revise: "Revise",
};

const ACTION_KEYS: ActionKey[] = ["draft", "revise", "ideate", "search", "check"];

export function ActionSettingsCard({
  initial,
  baseModel,
}: {
  initial: ActionSettings;
  baseModel: string | null;
}) {
  const [state, action, pending] = useActionState(
    saveActionSettingsAction,
    initialCardState as CardState,
  );

  return (
    <section className="settings-card" aria-labelledby="card-action-settings">
      <div className="settings-card__head">
        <span id="card-action-settings" className="settings-card__title">
          Per-action parameters
        </span>
        <span className="eyebrow">Advanced</span>
      </div>
      <p className="settings-card__desc">
        Override the temperature and model used for each action. Leave blank to use the defaults
        (draft 0.8, others 0.6) and the provider model from above. Useful when you want tighter
        Quality Check output or a beefier model just for Draft.
      </p>

      <form action={action}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
          {ACTION_KEYS.map((k) => {
            const cur = initial[k] ?? {};
            return (
              <div
                key={k}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(110px, 130px) minmax(110px, 140px) 1fr",
                  gap: 10,
                  alignItems: "end",
                }}
              >
                <div className="eyebrow" style={{ paddingBottom: 8 }}>
                  {ACTION_LABEL[k]}
                </div>
                <div>
                  <Label htmlFor={`${k}_temperature`} hint={`default ${DEFAULT_TEMPERATURE[k]}`}>
                    Temperature
                  </Label>
                  <Input
                    id={`${k}_temperature`}
                    name={`${k}_temperature`}
                    type="number"
                    step="0.05"
                    min="0"
                    max="2"
                    defaultValue={typeof cur.temperature === "number" ? String(cur.temperature) : ""}
                    placeholder={String(DEFAULT_TEMPERATURE[k])}
                  />
                </div>
                <div>
                  <Label htmlFor={`${k}_model`} hint={baseModel ? `default ${baseModel}` : "default from provider card"}>
                    Model override
                  </Label>
                  <Input
                    id={`${k}_model`}
                    name={`${k}_model`}
                    defaultValue={cur.model ?? ""}
                    placeholder={baseModel ?? "gpt-5"}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {state.error ? (
          <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "var(--color-danger)" }}>
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p style={{ marginTop: 14, fontSize: 13, color: "var(--color-success)" }}>{state.ok}</p>
        ) : null}

        <div className="settings-card__foot">
          <span className="eyebrow">Saves on submit</span>
          <Button variant="primary" type="submit" streaming={pending} streamingLabel="Saving">
            Save parameters
          </Button>
        </div>
      </form>
    </section>
  );
}
