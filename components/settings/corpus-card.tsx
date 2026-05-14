"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
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

type Mode = "idle" | "add" | "replace";

export function CorpusCard({
  postCount,
  oldest,
  newest,
  indexedAt,
  topReactions,
  avgReactions,
  postsWithReactions,
}: {
  postCount: number;
  oldest: string | null;
  newest: string | null;
  indexedAt: string | null;
  topReactions?: number;
  avgReactions?: number | null;
  postsWithReactions?: number;
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
        {(postsWithReactions ?? 0) > 0 ? (
          <>
            <Stat label="With reactions" value={`${postsWithReactions}`} />
            <Stat
              label="Avg reactions"
              value={avgReactions != null ? avgReactions.toFixed(0) : "—"}
            />
            <Stat label="Top reactions" value={topReactions != null ? String(topReactions) : "—"} />
          </>
        ) : null}
      </div>

      {mode === "idle" ? (
        <div className="settings-card__foot">
          <span className="eyebrow">Bulk operations</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setMode("replace")}>
              Replace corpus
            </Button>
            <Button variant="secondary" type="button" onClick={() => setMode("add")}>
              Add posts
            </Button>
          </div>
        </div>
      ) : (
        <form action={action}>
          <Textarea
            name="posts"
            variant="mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`[\n  {\n    "date": "2024-09-12",\n    "text": "...",\n    "hook": "...",\n    "url": "...",\n    "reactions": 124,\n    "comments": 18,\n    "reposts": 7\n  }\n]`}
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
