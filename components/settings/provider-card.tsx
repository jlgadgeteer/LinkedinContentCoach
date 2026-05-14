"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  saveProviderSettingsAction,
  testProviderAction,
  type CardState,
} from "@/lib/settings-actions";
import { MODELS } from "@/lib/llm-models";

type Provider = "anthropic" | "openai";

const CUSTOM = "__custom__";

const initial: CardState = { error: null, ok: null };

function formatRelative(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

export function ProviderCard(props: {
  provider: Provider | null;
  model: string | null;
  hasApiKey: boolean;
  lastVerifiedAt: string | null;
}) {
  // The keyed inner ensures useState reinitializes whenever the server props
  // change (e.g. after a successful save's revalidation). This fixes the
  // "form silently reverts to Anthropic" report: on revalidation, the inner
  // remounts with the freshly-saved provider, so state never drifts from
  // what's actually in the DB after each action.
  const k = `${props.provider ?? "anthropic"}|${props.model ?? ""}`;
  return <ProviderCardInner key={k} {...props} />;
}

function ProviderCardInner({
  provider: initialProvider,
  model: initialModel,
  hasApiKey,
  lastVerifiedAt,
}: {
  provider: Provider | null;
  model: string | null;
  hasApiKey: boolean;
  lastVerifiedAt: string | null;
}) {
  const [provider, setProvider] = useState<Provider>(initialProvider ?? "anthropic");
  const modelChoices = useMemo(() => MODELS[provider], [provider]);

  const startingModel = initialModel ?? modelChoices[0]!.id;
  const startingIsCustom = !modelChoices.some((m) => m.id === startingModel);
  const [model, setModel] = useState<string>(startingModel);
  const [isCustom, setIsCustom] = useState<boolean>(startingIsCustom);

  const [saveState, saveAction, savePending] = useActionState(
    saveProviderSettingsAction,
    initial,
  );
  const [testState, testAction, testPending] = useActionState(testProviderAction, initial);

  const verifiedRel = formatRelative(testState.ok ? new Date().toISOString() : lastVerifiedAt);

  function handleProviderChange(next: Provider) {
    setProvider(next);
    // Cascade the model to the first option of the new provider's catalog
    // so the Model select is never out of sync with the Provider select.
    setModel(MODELS[next][0]!.id);
    setIsCustom(false);
  }

  return (
    <section className="settings-card" aria-labelledby="card-provider">
      <div className="settings-card__head">
        <span id="card-provider" className="settings-card__title">
          Provider and API key
        </span>
        <span className="eyebrow">{provider}</span>
      </div>
      <p className="settings-card__desc">
        Bring your own key. We send a single test request to confirm it works, then encrypt it
        with your AUTH_PASSWORD. Models listed below all support the chat-completions endpoint;
        for newer Responses-API-only models (e.g. <code>gpt-5.5-pro</code>) use Custom model ID
        but expect the test to fail.
      </p>

      <form action={saveAction}>
        <div className="field-row">
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select
              key={`provider-${provider}`}
              id="provider"
              name="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="model-select">Model</Label>
            <Select
              key={`model-${provider}-${isCustom}`}
              id="model-select"
              value={isCustom ? CUSTOM : model}
              onChange={(e) => {
                const v = e.target.value;
                if (v === CUSTOM) {
                  setIsCustom(true);
                } else {
                  setIsCustom(false);
                  setModel(v);
                }
              }}
            >
              {modelChoices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              <option value={CUSTOM}>Custom model ID…</option>
            </Select>
            {isCustom ? (
              <div style={{ marginTop: 8 }}>
                <Input
                  id="model"
                  name="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider === "openai" ? "gpt-5.5" : "claude-sonnet-4-7"}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="eyebrow" style={{ marginTop: 4 }}>
                  Paste any model ID the provider exposes. Test before saving.
                </p>
              </div>
            ) : (
              <input type="hidden" name="model" value={model} />
            )}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Label htmlFor="apiKey" hint={hasApiKey ? "leave blank to keep current" : undefined}>
            API key
          </Label>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            placeholder={hasApiKey ? "•••••• stored" : provider === "anthropic" ? "sk-ant-..." : "sk-..."}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {(saveState.error ?? testState.error) && (
          <p
            role="alert"
            style={{
              marginTop: 14,
              fontSize: 13,
              color: "var(--color-danger)",
            }}
          >
            {saveState.error ?? testState.error}
          </p>
        )}
        {(saveState.ok ?? testState.ok) && (
          <p
            style={{
              marginTop: 14,
              fontSize: 13,
              color: "var(--color-success)",
            }}
          >
            {saveState.ok ?? testState.ok}
          </p>
        )}

        <div className="settings-card__foot">
          <span className="eyebrow">
            {verifiedRel ? `Last verified ${verifiedRel}` : "Never verified"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="secondary"
              type="submit"
              formAction={testAction}
              streaming={testPending}
              streamingLabel="Testing"
            >
              Test connection
            </Button>
            <Button
              variant="primary"
              type="submit"
              streaming={savePending}
              streamingLabel="Saving"
            >
              Save provider
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
