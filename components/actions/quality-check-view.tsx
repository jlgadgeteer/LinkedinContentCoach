"use client";

import { useState } from "react";
import { ActionShell } from "@/components/actions/action-shell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QualityCheckView() {
  const [draft, setDraft] = useState<string>("");

  return (
    <ActionShell
      kind="check"
      eyebrow="Action · Quality check"
      title="Quality check"
      primaryLabel="Check again"
      primaryStreamingLabel="Checking"
      canSubmit={draft.trim().length > 0}
      buildPayload={() => (draft.trim() ? { draft } : null)}
    >
      <div>
        <Label htmlFor="draft">Draft</Label>
        <Textarea
          id="draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste a draft and we'll surface AI tells, voice drift, and weak openings."
          style={{ minHeight: 140 }}
        />
      </div>
    </ActionShell>
  );
}
