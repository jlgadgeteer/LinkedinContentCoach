"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveProviderAction, type ActionState } from "@/lib/setup-actions";

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

const initial: ActionState = { error: null };

export function StepProviderForm({
  defaultProvider,
  defaultModel,
}: {
  defaultProvider?: Provider;
  defaultModel?: string;
}) {
  const [state, action, pending] = useActionState(saveProviderAction, initial);
  const [provider, setProvider] = useState<Provider>(defaultProvider ?? "anthropic");
  const modelChoices = useMemo(() => MODELS[provider], [provider]);
  const [model, setModel] = useState<string>(defaultModel ?? modelChoices[0]!.id);

  return (
    <form action={action} noValidate>
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
          <Select id="model" name="model" value={model} onChange={(e) => setModel(e.target.value)}>
            {modelChoices.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Label htmlFor="apiKey">API key</Label>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          placeholder={provider === "anthropic" ? "sk-ant-..." : "sk-..."}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="help">
          We send a single test request to confirm it works, then encrypt it at rest. Your key
          never leaves this Vercel project.
        </p>
      </div>

      {state.error && (
        <p
          role="alert"
          style={{
            marginTop: 16,
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--color-danger)",
          }}
        >
          {state.error}
        </p>
      )}

      <div className="wizard__foot">
        <Link href="/setup?step=2" className="btn btn--ghost">
          Skip this step
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="primary"
            type="submit"
            streaming={pending}
            streamingLabel="Testing"
          >
            Test and continue
          </Button>
        </div>
      </div>
    </form>
  );
}
