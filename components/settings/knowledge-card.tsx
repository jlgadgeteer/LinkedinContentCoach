"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  saveKnowledgeAction,
  type KnowledgeCardState,
} from "@/lib/interview-actions";

const initial: KnowledgeCardState = { error: null, ok: null };

export function KnowledgeCard({ initial: initialMarkdown }: { initial: string }) {
  const [value, setValue] = useState<string>(initialMarkdown);
  const [state, action, pending] = useActionState(saveKnowledgeAction, initial);
  const lineCount = value.split("\n").length;
  const sizeKb = (new Blob([value]).size / 1024).toFixed(1);

  return (
    <section className="settings-card" aria-labelledby="card-knowledge">
      <div className="settings-card__head">
        <span id="card-knowledge" className="settings-card__title">
          Knowledge profile
        </span>
        <span className="eyebrow">
          {lineCount} lines · {sizeKb} KB
        </span>
      </div>
      <p className="settings-card__desc">
        What you know, what you believe, who you write for. Built up by Interview Me sessions and
        injected into every action alongside your voice profile. You can edit it directly here.
      </p>

      <form action={action}>
        <Textarea
          name="markdown"
          variant="mono"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ minHeight: 180 }}
          spellCheck={false}
          placeholder={
            "## Strong opinions\n\n## Audience\n\n## Topics I own\n\n## Recent work\n\n## Anti-patterns I've seen"
          }
        />

        {state.error ? (
          <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "var(--color-danger)" }}>
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p style={{ marginTop: 14, fontSize: 13, color: "var(--color-success)" }}>
            {state.ok}
          </p>
        ) : null}

        <div className="settings-card__foot">
          <span className="eyebrow">
            <Link href="/interview" style={{ textDecoration: "underline" }}>
              Run an interview
            </Link>{" "}
            to update via Q&A
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" type="button" onClick={() => setValue(initialMarkdown)}>
              Revert
            </Button>
            <Button variant="primary" type="submit" streaming={pending} streamingLabel="Saving">
              Save knowledge
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
