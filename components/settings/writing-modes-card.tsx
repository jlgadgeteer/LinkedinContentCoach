"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createWritingModeAction,
  deleteWritingModeAction,
  updateWritingModeAction,
} from "@/lib/quality-actions";
import { initialCardState, type CardState } from "@/lib/card-state";

export type ModeRow = {
  id: string;
  slug: string;
  name: string;
  markdown: string;
};

export function WritingModesCard({ modes }: { modes: ModeRow[] }) {
  return (
    <section className="settings-card" aria-labelledby="card-modes">
      <div className="settings-card__head">
        <span id="card-modes" className="settings-card__title">
          Writing modes
        </span>
        <span className="eyebrow">{modes.length} mode{modes.length === 1 ? "" : "s"}</span>
      </div>
      <p className="settings-card__desc">
        Named prompt presets (e.g. "thought leadership", "company milestone", "build-in-public
        update"). The Draft action shows a Mode dropdown so you pick one per draft. The selected
        mode is appended to the system prompt on top of your voice profile.
      </p>

      {modes.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {modes.map((m) => (
            <li key={m.id}>
              <ModeEditor mode={m} />
            </li>
          ))}
        </ul>
      ) : null}

      <details style={{ marginTop: 20 }}>
        <summary className="eyebrow" style={{ cursor: "pointer" }}>
          Add a new mode
        </summary>
        <ModeCreator />
      </details>
    </section>
  );
}

function ModeCreator() {
  const [name, setName] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [state, action, pending] = useActionState(createWritingModeAction, initialCardState as CardState);

  return (
    <form
      action={action}
      style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}
    >
      <div>
        <Label htmlFor="new-mode-name">Mode name</Label>
        <Input
          id="new-mode-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Thought leadership"
        />
      </div>
      <div>
        <Label htmlFor="new-mode-md">Mode prompt (markdown)</Label>
        <Textarea
          id="new-mode-md"
          name="markdown"
          variant="mono"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          style={{ minHeight: 140 }}
          placeholder={"Lead with a counter-intuitive observation.\nKeep it under 220 words.\nNo lists; one tight argument."}
          spellCheck={false}
        />
      </div>
      {state.error ? (
        <p role="alert" style={{ fontSize: 13, color: "var(--color-danger)" }}>
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p style={{ fontSize: 13, color: "var(--color-success)" }}>{state.ok}</p>
      ) : null}
      <Button type="submit" variant="primary" streaming={pending} streamingLabel="Saving">
        Add mode
      </Button>
    </form>
  );
}

function ModeEditor({ mode }: { mode: ModeRow }) {
  const [name, setName] = useState(mode.name);
  const [markdown, setMarkdown] = useState(mode.markdown);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateWritingModeAction, initialCardState as CardState);

  return (
    <article className="card" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span className="card-title">{mode.name}</span>
        <span className="eyebrow">slug: {mode.slug}</span>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Edit"}
        </button>
        <form action={deleteWritingModeAction}>
          <input type="hidden" name="id" value={mode.id} />
          <button
            type="submit"
            className="btn btn--ghost btn--sm"
            style={{ color: "var(--color-danger)" }}
          >
            Delete
          </button>
        </form>
      </div>

      {open ? (
        <form
          action={action}
          style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}
        >
          <input type="hidden" name="id" value={mode.id} />
          <div>
            <Label htmlFor={`mode-name-${mode.id}`}>Name</Label>
            <Input
              id={`mode-name-${mode.id}`}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`mode-md-${mode.id}`}>Prompt</Label>
            <Textarea
              id={`mode-md-${mode.id}`}
              name="markdown"
              variant="mono"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              style={{ minHeight: 140 }}
              spellCheck={false}
            />
          </div>
          {state.error ? (
            <p role="alert" style={{ fontSize: 13, color: "var(--color-danger)" }}>
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p style={{ fontSize: 13, color: "var(--color-success)" }}>{state.ok}</p>
          ) : null}
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="submit" variant="primary" streaming={pending} streamingLabel="Saving">
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName(mode.name);
                setMarkdown(mode.markdown);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
