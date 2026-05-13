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
    </section>
  );
}
