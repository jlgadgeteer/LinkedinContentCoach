"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionShell } from "@/components/actions/action-shell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseIdeas } from "@/lib/ideas";

export function IdeateView({ defaultTopic }: { defaultTopic?: string }) {
  const [topic, setTopic] = useState<string>(defaultTopic ?? "");

  return (
    <ActionShell
      kind="ideate"
      eyebrow="Action · Ideate"
      title="Five angles"
      primaryLabel="Five angles"
      primaryStreamingLabel="Ideating"
      canSubmit={topic.trim().length > 0}
      buildPayload={() => (topic.trim() ? { topic: topic.trim() } : null)}
      renderDone={(text) => <IdeaList text={text} />}
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

function IdeaList({ text }: { text: string }) {
  const ideas = parseIdeas(text);
  if (ideas.length === 0) {
    return <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>;
  }
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {ideas.map((idea, i) => (
        <li key={i}>
          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
              <span className="card-title">{idea.hook || `Angle ${i + 1}`}</span>
              <Link
                href={`/draft?topic=${encodeURIComponent(idea.hook || idea.angle)}`}
                className="btn btn--secondary btn--sm"
              >
                Draft this idea
              </Link>
            </div>
            {idea.angle ? (
              <p className="card-desc" style={{ marginTop: 8 }}>
                <span className="eyebrow" style={{ marginRight: 8 }}>Angle</span>
                {idea.angle}
              </p>
            ) : null}
            {idea.whyNow ? (
              <p className="card-desc" style={{ marginTop: 6 }}>
                <span className="eyebrow" style={{ marginRight: 8 }}>Why now</span>
                {idea.whyNow}
              </p>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  );
}
