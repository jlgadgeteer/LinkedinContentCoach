"use client";

import { useState } from "react";
import { ActionShell } from "@/components/actions/action-shell";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type DraftMode = { slug: string; name: string };

export function DraftView({
  defaultTopic,
  postCount,
  modes = [],
  defaultMode,
}: {
  defaultTopic?: string;
  postCount: number;
  modes?: DraftMode[];
  defaultMode?: string;
}) {
  const [topic, setTopic] = useState<string>(defaultTopic ?? "");
  const [mode, setMode] = useState<string>(defaultMode ?? "");

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
      buildPayload={() => {
        if (!topic.trim()) return null;
        return mode ? { topic: topic.trim(), mode } : { topic: topic.trim() };
      }}
      formatPosts
    >
      {modes.length > 0 ? (
        <div>
          <Label htmlFor="mode" hint="Optional. Picks a saved prompt preset.">
            Writing mode
          </Label>
          <Select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="">Default (voice profile only)</option>
            {modes.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
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
