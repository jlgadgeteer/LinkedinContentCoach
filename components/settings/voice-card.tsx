"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveVoiceSettingsAction, type CardState } from "@/lib/settings-actions";

const initial: CardState = { error: null, ok: null };

export function VoiceCard({
  initial: initialMarkdown,
  postCount,
}: {
  initial: string;
  postCount: number;
}) {
  const [value, setValue] = useState<string>(initialMarkdown);
  const [state, action, pending] = useActionState(saveVoiceSettingsAction, initial);
  const lineCount = value.split("\n").length;
  const sizeKb = (new Blob([value]).size / 1024).toFixed(1);

  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [proposed, setProposed] = useState<string | null>(null);
  const canGenerate = postCount >= 5;

  async function generate() {
    if (genBusy) return;
    setGenBusy(true);
    setGenErr(null);
    setProposed(null);
    try {
      const res = await fetch("/api/voice/generate", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { markdown: string };
      setProposed(data.markdown);
    } catch (e) {
      setGenErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <section className="settings-card" aria-labelledby="card-voice">
      <div className="settings-card__head">
        <span id="card-voice" className="settings-card__title">
          Voice profile
        </span>
        <span className="eyebrow">{lineCount} lines · {sizeKb} KB</span>
      </div>
      <p className="settings-card__desc">
        Plain markdown. The model reads it before every action and tries hard not to drift. Run
        Generate from my posts to bootstrap from your existing corpus, or write it yourself.
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
          <span className="eyebrow">
            {canGenerate ? `${postCount} posts available for extraction` : `Need ${5 - postCount} more posts to enable generation`}
          </span>
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

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            variant="secondary"
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            streaming={genBusy}
            streamingLabel="Reading your posts"
          >
            Generate from my posts
          </Button>
          {genErr ? (
            <span role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
              {genErr}
            </span>
          ) : null}
        </div>

        {proposed ? (
          <article className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <span className="card-title">Proposed voice profile</span>
              <span className="eyebrow">{proposed.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <pre
              style={{
                marginTop: 12,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                lineHeight: 1.55,
                color: "var(--color-fg-muted)",
                maxHeight: 320,
                overflow: "auto",
                background: "var(--color-surface-alt, transparent)",
                padding: 12,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              {proposed}
            </pre>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              This replaces what's in the editor above. Save to make it live, or discard.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Button
                variant="primary"
                type="button"
                onClick={() => {
                  setValue(proposed);
                  setProposed(null);
                }}
              >
                Use this draft
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setProposed(null)}
              >
                Discard
              </Button>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
