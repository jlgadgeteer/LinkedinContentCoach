"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
import { MODELS, TEMPERATURE_STEPS } from "@/lib/llm-models";
import type { Provider } from "@/lib/types";

const ACTION_LABEL: Record<ActionKey, string> = {
  draft: "Draft",
  ideate: "Ideate",
  search: "Search",
  check: "Quality check",
  revise: "Revise",
};

const ACTION_KEYS: ActionKey[] = ["draft", "revise", "ideate", "search", "check"];

const CUSTOM = "__custom__";
const DEFAULT_SENTINEL = "";

export function ActionSettingsCard({
  initial,
  baseModel,
  provider,
}: {
  initial: ActionSettings;
  baseModel: string | null;
  provider: Provider | null;
}) {
  const [state, action, pending] = useActionState(
    saveActionSettingsAction,
    initialCardState as CardState,
  );

  const modelChoices = provider ? MODELS[provider] : [];

  return (
    <section className="settings-card" aria-labelledby="card-action-settings">
      <div className="settings-card__head">
        <span id="card-action-settings" className="settings-card__title">
          Per-action parameters
        </span>
        <span className="eyebrow">Advanced</span>
      </div>
      <p className="settings-card__desc">
        Override the temperature and model used for each action. Leave at <em>Default</em> to use
        the defaults (draft 0.8, others 0.6) and the provider model from above. Useful when you
        want tighter Quality Check output or a beefier model just for Draft.
      </p>

      <form action={action}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
          {ACTION_KEYS.map((k) => (
            <ActionRow
              key={k}
              actionKey={k}
              initial={initial[k] ?? {}}
              modelChoices={modelChoices}
              baseModel={baseModel}
            />
          ))}
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

function ActionRow({
  actionKey,
  initial,
  modelChoices,
  baseModel,
}: {
  actionKey: ActionKey;
  initial: { temperature?: number; model?: string };
  modelChoices: { id: string; label: string }[];
  baseModel: string | null;
}) {
  // Temperature dropdown: each option's value is the numeric temperature as a
  // string, "" means "use default", CUSTOM swaps in a number input. If the
  // saved value isn't in TEMPERATURE_STEPS, start in custom mode so the user
  // sees and can edit it.
  const initialTempIsCustom =
    typeof initial.temperature === "number" &&
    !TEMPERATURE_STEPS.includes(initial.temperature as (typeof TEMPERATURE_STEPS)[number]);
  const [tempSelect, setTempSelect] = useState<string>(() => {
    if (initial.temperature === undefined) return DEFAULT_SENTINEL;
    return initialTempIsCustom ? CUSTOM : String(initial.temperature);
  });
  const [tempCustom, setTempCustom] = useState<string>(() =>
    initialTempIsCustom ? String(initial.temperature) : "",
  );

  // Model dropdown: "" means "use default", a known id is a chosen override,
  // CUSTOM swaps in a text input. Same start-in-custom logic as temperature.
  const initialModelIsCustom =
    !!initial.model && !modelChoices.some((m) => m.id === initial.model);
  const [modelSelect, setModelSelect] = useState<string>(() => {
    if (!initial.model) return DEFAULT_SENTINEL;
    return initialModelIsCustom ? CUSTOM : initial.model;
  });
  const [modelCustom, setModelCustom] = useState<string>(() =>
    initialModelIsCustom ? (initial.model ?? "") : "",
  );

  // The hidden inputs are what the server action reads. We submit the resolved
  // value: blank for default, the picked option's value, or the custom text.
  const tempSubmitValue =
    tempSelect === DEFAULT_SENTINEL ? "" : tempSelect === CUSTOM ? tempCustom : tempSelect;
  const modelSubmitValue =
    modelSelect === DEFAULT_SENTINEL
      ? ""
      : modelSelect === CUSTOM
        ? modelCustom
        : modelSelect;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(110px, 130px) 1fr 1fr",
        gap: 12,
        alignItems: "start",
      }}
    >
      <div className="eyebrow" style={{ paddingTop: 28 }}>
        {ACTION_LABEL[actionKey]}
      </div>

      <div>
        <Label htmlFor={`${actionKey}_temperature_select`} hint={`default ${DEFAULT_TEMPERATURE[actionKey]}`}>
          Temperature
        </Label>
        <Select
          id={`${actionKey}_temperature_select`}
          value={tempSelect}
          onChange={(e) => setTempSelect(e.target.value)}
        >
          <option value={DEFAULT_SENTINEL}>Default ({DEFAULT_TEMPERATURE[actionKey]})</option>
          {TEMPERATURE_STEPS.map((t) => (
            <option key={t} value={String(t)}>
              {t.toFixed(1)}
            </option>
          ))}
          <option value={CUSTOM}>Custom…</option>
        </Select>
        {tempSelect === CUSTOM ? (
          <div style={{ marginTop: 8 }}>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="2"
              value={tempCustom}
              onChange={(e) => setTempCustom(e.target.value)}
              placeholder="0 to 2"
            />
          </div>
        ) : null}
        <input type="hidden" name={`${actionKey}_temperature`} value={tempSubmitValue} />
      </div>

      <div>
        <Label
          htmlFor={`${actionKey}_model_select`}
          hint={baseModel ? `default ${baseModel}` : "default from provider card"}
        >
          Model override
        </Label>
        <Select
          id={`${actionKey}_model_select`}
          value={modelSelect}
          onChange={(e) => setModelSelect(e.target.value)}
          disabled={modelChoices.length === 0}
        >
          <option value={DEFAULT_SENTINEL}>
            Default{baseModel ? ` (${baseModel})` : ""}
          </option>
          {modelChoices.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
          <option value={CUSTOM}>Custom model ID…</option>
        </Select>
        {modelSelect === CUSTOM ? (
          <div style={{ marginTop: 8 }}>
            <Input
              value={modelCustom}
              onChange={(e) => setModelCustom(e.target.value)}
              placeholder={baseModel ?? "gpt-5.5"}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ) : null}
        <input type="hidden" name={`${actionKey}_model`} value={modelSubmitValue} />
      </div>
    </div>
  );
}
