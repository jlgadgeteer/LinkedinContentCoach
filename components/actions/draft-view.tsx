"use client";

import { useState } from "react";
import { ActionShell } from "@/components/actions/action-shell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DraftView({
  defaultTopic,
  postCount,
}: {
  defaultTopic?: string;
  postCount: number;
}) {
  const [topic, setTopic] = useState<string>(defaultTopic ?? "");

  return (
    <ActionShell
      kind="draft"
      eyebrow="Action · Draft"
      title="Draft a post"
      rightMeta={
        <span className="eyebrow">
          Using voice · {postCount} example{postCount === 1 ? "" : "s"}
        </span>
      }
      primaryLabel="Draft"
      primaryStreamingLabel="Drafting"
      canSubmit={topic.trim().length > 0}
      buildPayload={() => (topic.trim() ? { topic: topic.trim() } : null)}
      formatPosts
    >
      <div>
        <Label htmlFor="topic">Topic</Label>
        <Textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Why most AI pilots stall at the proof-of-concept stage"
          style={{ minHeight: 96 }}
        />
      </div>
    </ActionShell>
  );
}
