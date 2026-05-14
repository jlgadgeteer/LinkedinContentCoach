"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addPostsAction,
  replacePostsAction,
  type CardState,
} from "@/lib/settings-actions";

const initial: CardState = { error: null, ok: null };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().slice(0, 16).replace("T", " · ");
}

type Mode = "idle" | "add" | "replace" | "quick";

export function CorpusCard({
  postCount,
  oldest,
  newest,
  indexedAt,
}: {
  postCount: number;
  oldest: string | null;
  newest: string | null;
  indexedAt: string | null;
}) {
  const [addState, addAction, addPending] = useActionState(addPostsAction, initial);
  const [replaceState, replaceAction, replacePending] = useActionState(
    replacePostsAction,
    initial,
  );
  const [mode, setMode] = useState<Mode>("idle");
  const [text, setText] = useState<string>("");

  const lastState = mode === "replace" ? replaceState : addState;
  const lastPending = mode === "replace" ? replacePending : addPending;
  const action = mode === "replace" ? replaceAction : addAction;

  return (
    <section className="settings-card" aria-labelledby="card-corpus">
      <div className="settings-card__head">
        <span id="card-corpus" className="settings-card__title">
          Post corpus
        </span>
        <span className="eyebrow">{postCount} posts</span>
      </div>
      <p className="settings-card__desc">
        Your past LinkedIn posts. The model reads up to the 30 most recent before each action,
        and the search tool looks at every one.
      </p>

      <div
        className="content"
        style={{
          background: "var(--color-sunken)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Stat label="Posts" value={String(postCount)} />
        <Stat
          label="Range"
          value={
            oldest && newest
              ? `${formatDate(oldest)} → ${formatDate(newest)}`
              : "no dates yet"
          }
        />
        <Stat label="Last loaded" value={formatTimestamp(indexedAt)} />
      </div>

      {mode === "idle" ? (
        <div className="settings-card__foot">
          <span className="eyebrow">Add or replace</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setMode("quick")}>
              Quick add one
            </Button>
            <Button variant="secondary" type="button" onClick={() => setMode("replace")}>
              Replace corpus
            </Button>
            <Button variant="secondary" type="button" onClick={() => setMode("add")}>
              Add JSON batch
            </Button>
          </div>
        </div>
      ) : mode === "quick" ? (
        <QuickAddForm onDone={() => setMode("idle")} />
      ) : (
        <form action={action}>
          <Textarea
            name="posts"
            variant="mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`[\n  { "date": "2024-09-12", "text": "...", "hook": "...", "url": "..." }\n]`}
            style={{ minHeight: 180 }}
            spellCheck={false}
          />
          {lastState.error && (
            <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "var(--color-danger)" }}>
              {lastState.error}
            </p>
          )}
          {lastState.ok && (
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--color-success)" }}>
              {lastState.ok}
            </p>
          )}
          <div className="settings-card__foot">
            <span className="eyebrow">
              {mode === "replace" ? "This deletes the current corpus" : "Appends to the corpus"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setMode("idle");
                  setText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant={mode === "replace" ? "primary" : "primary"}
                type="submit"
                streaming={lastPending}
                streamingLabel={mode === "replace" ? "Replacing" : "Adding"}
              >
                {mode === "replace" ? "Replace corpus" : "Add posts"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-fg-faint)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--color-fg)" }}>{value}</div>
    </div>
  );
}

function QuickAddForm({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/posts/quick-add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          text: text.trim() || undefined,
          publishedAt: publishedAt.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setOk("Added to corpus.");
      setUrl("");
      setText("");
      setPublishedAt("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <Label htmlFor="qa-url" hint="Optional. We try to read OG metadata; LinkedIn often blocks this.">
          LinkedIn post URL
        </Label>
        <Input
          id="qa-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.linkedin.com/posts/..."
          autoComplete="off"
        />
      </div>
      <div>
        <Label htmlFor="qa-text" hint="Required if URL fetch can't recover the body.">
          Post text
        </Label>
        <Textarea
          id="qa-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full post text here. The first non-empty line becomes the hook automatically."
          style={{ minHeight: 140 }}
        />
      </div>
      <div>
        <Label htmlFor="qa-date" hint="Optional. Defaults to today.">
          Published at
        </Label>
        <Input
          id="qa-date"
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
        />
      </div>
      {err ? (
        <p role="alert" style={{ fontSize: 13, color: "var(--color-danger)" }}>
          {err}
        </p>
      ) : null}
      {ok ? (
        <p style={{ fontSize: 13, color: "var(--color-success)" }}>{ok}</p>
      ) : null}
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="submit"
          variant="primary"
          streaming={busy}
          streamingLabel="Saving"
          disabled={!url.trim() && !text.trim()}
        >
          Add to corpus
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Done
        </Button>
      </div>
    </form>
  );
}
