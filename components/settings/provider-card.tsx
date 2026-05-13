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

type Provider = "anthropic" | "openai";

const MODELS: Record<Provider, { id: string; label: string }[]> = {
  anthropic: [
    { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
};

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

export function ProviderCard({
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
  const [model, setModel] = useState<string>(initialModel ?? modelChoices[0]!.id);

  const [saveState, saveAction, savePending] = useActionState(
    saveProviderSettingsAction,
    initial,
  );
  const [testState, testAction, testPending] = useActionState(testProviderAction, initial);

  const verifiedRel = formatRelative(testState.ok ? new Date().toISOString() : lastVerifiedAt);

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
        with your AUTH_PASSWORD.
      </p>

      <form action={saveAction}>
        <div className="field-row">
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select
              id="provider"
              name="provider"
              value={provider}
              onChange={(e) => {
                const next = e.target.value as Provider;
                setProvider(next);
                setModel(MODELS[next][0]!.id);
              }}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Select
              id="model"
              name="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {modelChoices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
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
