"use client";

import { useState } from "react";
import { ActionShell } from "@/components/actions/action-shell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function IdeateView() {
  const [topic, setTopic] = useState<string>("");

  return (
    <ActionShell
      kind="ideate"
      eyebrow="Action · Ideate"
      title="Five angles"
      primaryLabel="Five angles"
      primaryStreamingLabel="Ideating"
      canSubmit={topic.trim().length > 0}
      buildPayload={() => (topic.trim() ? { topic: topic.trim() } : null)}
    >
      <div>
        <Label htmlFor="topic">Rough idea</Label>
        <Textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Hiring senior engineers in 2026, what's changed since 2022"
          style={{ minHeight: 96 }}
        />
      </div>
    </ActionShell>
  );
}
