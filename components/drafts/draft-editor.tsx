"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormattedOutput } from "@/components/actions/format-output";
import {
  deleteDraftAction,
  setDraftScheduleAction,
  updateDraftBodyAction,
  updateDraftStatusAction,
} from "@/lib/drafts-actions";
import { initialDraftActionState } from "@/lib/card-state";
import type { DraftStatus } from "@/lib/db/schema";

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_LABEL: Record<DraftStatus, string> = {
  not_published: "Not published",
  scheduled: "Scheduled",
  published: "Published",
};

export function DraftEditor({
  id,
  initialTitle,
  initialBody,
  initialStatus,
  initialScheduledFor,
}: {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialStatus: DraftStatus;
  initialScheduledFor: string | null;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState<DraftStatus>(initialStatus);
  const [scheduledLocal, setScheduledLocal] = useState<string>(
    isoToLocalInput(initialScheduledFor),
  );
  const [editing, setEditing] = useState(false);

  const [statusState, statusFormAction, statusPending] = useActionState(
    updateDraftStatusAction,
    initialDraftActionState,
  );
  const [scheduleState, scheduleFormAction, schedulePending] = useActionState(
    setDraftScheduleAction,
    initialDraftActionState,
  );
  const [bodyState, bodyFormAction, bodyPending] = useActionState(
    updateDraftBodyAction,
    initialDraftActionState,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span className="card-title">Status</span>
          <span className="eyebrow">{STATUS_LABEL[status]}</span>
        </div>

        <form
          action={statusFormAction}
          style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "flex-end" }}
        >
          <input type="hidden" name="id" value={id} />
          <div style={{ flex: 1 }}>
            <Label htmlFor="status">Mark as</Label>
            <Select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as DraftStatus)}
            >
              <option value="not_published">Not published</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </Select>
          </div>
          <Button
            type="submit"
            variant="primary"
            streaming={statusPending}
            streamingLabel="Saving"
          >
            Update
          </Button>
        </form>
        {(statusState.ok ?? statusState.error) && (
          <p
            style={{
              fontSize: 13,
              marginTop: 10,
              color: statusState.error ? "var(--color-danger)" : "var(--color-success)",
            }}
            role={statusState.error ? "alert" : undefined}
          >
            {statusState.error ?? statusState.ok}
          </p>
        )}

        <form
          action={scheduleFormAction}
          style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "flex-end" }}
        >
          <input type="hidden" name="id" value={id} />
          <div style={{ flex: 1 }}>
            <Label htmlFor="scheduledFor" hint="Setting a date sets status to Scheduled">
              Scheduled for
            </Label>
            <Input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            streaming={schedulePending}
            streamingLabel="Saving"
          >
            {scheduledLocal ? "Set date" : "Clear date"}
          </Button>
        </form>
        {(scheduleState.ok ?? scheduleState.error) && (
          <p
            style={{
              fontSize: 13,
              marginTop: 10,
              color: scheduleState.error ? "var(--color-danger)" : "var(--color-success)",
            }}
            role={scheduleState.error ? "alert" : undefined}
          >
            {scheduleState.error ?? scheduleState.ok}
          </p>
        )}
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <h2 className="section-header">Post body</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>

        {editing ? (
          <form action={bodyFormAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="id" value={id} />
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ minHeight: 320 }}
              />
            </div>
            {(bodyState.ok ?? bodyState.error) && (
              <p
                style={{
                  fontSize: 13,
                  color: bodyState.error ? "var(--color-danger)" : "var(--color-success)",
                }}
                role={bodyState.error ? "alert" : undefined}
              >
                {bodyState.error ?? bodyState.ok}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="submit"
                variant="primary"
                streaming={bodyPending}
                streamingLabel="Saving"
              >
                Save changes
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTitle(initialTitle);
                  setBody(initialBody);
                  setEditing(false);
                }}
              >
                Discard
              </Button>
            </div>
          </form>
        ) : (
          <div className="card">
            <FormattedOutput text={`<post>${body}</post>`} />
          </div>
        )}
      </section>

      <section style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <CopyButton text={body} />
        <Link href="/drafts" className="btn btn--ghost btn--sm">
          Back to drafts
        </Link>
        <form action={deleteDraftAction} style={{ marginLeft: "auto" }}>
          <input type="hidden" name="id" value={id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            style={{ color: "var(--color-danger)" }}
          >
            Delete draft
          </Button>
        </form>
      </section>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore; older browsers without clipboard
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
