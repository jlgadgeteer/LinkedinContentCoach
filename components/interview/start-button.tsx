"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function StartInterviewButton({ label = "Start a new interview" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/interview/start", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { sessionId: string };
      router.push(`/interview/${data.sessionId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Button
        type="button"
        variant="primary"
        onClick={start}
        streaming={busy}
        streamingLabel="Preparing first question"
      >
        {label}
      </Button>
      {err ? (
        <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
          {err}
        </p>
      ) : null}
    </div>
  );
}
