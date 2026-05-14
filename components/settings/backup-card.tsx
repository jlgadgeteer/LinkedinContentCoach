"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { replacePostsAction } from "@/lib/settings-actions";

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string } | { kind: "ok"; message: string };

export function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setStatus({ kind: "busy" });
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const posts = Array.isArray(parsed?.posts) ? parsed.posts : null;
      if (!posts) {
        setStatus({ kind: "error", message: "Backup file is missing a `posts` array." });
        return;
      }
      // Reuse the replace-posts server action by stuffing the JSON into a
      // FormData. The voice profile in the file is intentionally not
      // touched here; restoring it would clobber the user's current
      // profile silently. They can paste it manually if they want.
      const fd = new FormData();
      fd.set("posts", JSON.stringify(posts));
      const res = await replacePostsAction({ error: null, ok: null }, fd);
      if (res.error) setStatus({ kind: "error", message: res.error });
      else setStatus({ kind: "ok", message: res.ok ?? "Restore complete." });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't read the file.",
      });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="settings-card" aria-labelledby="card-backup">
      <div className="settings-card__head">
        <span id="card-backup" className="settings-card__title">
          Backup and restore
        </span>
      </div>
      <p className="settings-card__desc">
        Download a JSON of your voice profile and post corpus. The API key is excluded; back it
        up separately in a password manager.
      </p>

      {status.kind === "error" && (
        <p role="alert" style={{ marginTop: 12, fontSize: 13, color: "var(--color-danger)" }}>
          {status.message}
        </p>
      )}
      {status.kind === "ok" && (
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--color-success)" }}>
          {status.message}
        </p>
      )}

      <div className="settings-card__foot">
        <span className="eyebrow">Voice profile is preserved during restore</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={onPickFile}
            style={{ display: "none" }}
            aria-label="Pick a backup file"
          />
          <Button
            variant="secondary"
            type="button"
            onClick={() => fileRef.current?.click()}
            streaming={status.kind === "busy"}
            streamingLabel="Restoring"
          >
            Restore from file
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              window.location.href = "/api/backup";
            }}
          >
            Download backup
          </Button>
        </div>
      </div>

      <MigrateRow />
    </section>
  );
}

function MigrateRow() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; message: string }
    | { kind: "warn"; message: string; failures: { statement: string; error: string }[] }
    | { kind: "error"; message: string }
    | null
  >(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/migrate", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
        failures?: { statement: string; error: string }[];
      };
      if (!res.ok) {
        setResult({ kind: "error", message: body.error ?? `HTTP ${res.status}` });
      } else if (body.failures && body.failures.length > 0) {
        setResult({
          kind: "warn",
          message: body.message ?? `${body.failures.length} statement(s) failed.`,
          failures: body.failures,
        });
      } else {
        setResult({ kind: "ok", message: body.message ?? "Schema is up to date." });
      }
    } catch (err) {
      setResult({ kind: "error", message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">Schema check</span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={run}
          streaming={busy}
          streamingLabel="Checking"
        >
          Run schema check
        </Button>
      </div>
      <p className="muted" style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.55 }}>
        Re-applies the idempotent migration. Safe to run any time. Useful if a feature card is
        empty when it shouldn't be, or if you see a 500 after a deploy.
      </p>
      {result?.kind === "ok" ? (
        <p style={{ fontSize: 13, color: "var(--color-success)", marginTop: 8 }}>{result.message}</p>
      ) : null}
      {result?.kind === "warn" ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, color: "var(--color-danger)" }}>{result.message}</p>
          <ul style={{ margin: "8px 0 0 16px", fontSize: 12, color: "var(--color-fg-muted)" }}>
            {result.failures.map((f, i) => (
              <li key={i}>
                <span className="mono">{f.statement}</span>: {f.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result?.kind === "error" ? (
        <p role="alert" style={{ fontSize: 13, color: "var(--color-danger)", marginTop: 8 }}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
