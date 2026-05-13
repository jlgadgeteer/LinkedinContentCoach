"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllPosts,
  getSettings,
  getVoiceProfile,
} from "@/lib/db";
import type { Action, Post, Settings, VoiceProfile } from "@/lib/types";

type WorkspaceState = {
  loading: boolean;
  settings: Settings | null;
  voiceProfile: VoiceProfile | null;
  posts: Post[];
};

const ACTIONS: { id: Action; label: string; description: string; inputLabel: string; inputPlaceholder: string; inputType: "single" | "draft" }[] = [
  {
    id: "draft",
    label: "Draft a post",
    description: "Write a post in your voice from a topic or idea.",
    inputLabel: "Topic",
    inputPlaceholder: "Why most AI pilots stall at the proof-of-concept stage...",
    inputType: "single",
  },
  {
    id: "ideate",
    label: "Ideate",
    description: "Generate post ideas based on your themes and recent work.",
    inputLabel: "Focus area (optional)",
    inputPlaceholder: "Leave blank for general ideas, or focus on a theme like AI strategy",
    inputType: "single",
  },
  {
    id: "search",
    label: "Search past posts",
    description: "Find what you've already written before drafting something new.",
    inputLabel: "Query",
    inputPlaceholder: "What did I write about build vs buy?",
    inputType: "single",
  },
  {
    id: "check",
    label: "Quality check",
    description: "Scan a draft for AI tells, banned phrases, and voice drift.",
    inputLabel: "Draft to check",
    inputPlaceholder: "Paste your draft here...",
    inputType: "draft",
  },
];

export function Workspace() {
  const [state, setState] = useState<WorkspaceState>({
    loading: true,
    settings: null,
    voiceProfile: null,
    posts: [],
  });

  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [settings, voiceProfile, posts] = await Promise.all([
        getSettings(),
        getVoiceProfile(),
        getAllPosts(),
      ]);
      setState({ loading: false, settings: settings ?? null, voiceProfile: voiceProfile ?? null, posts });
    })();
  }, []);

  const needsSetup = !state.loading && (!state.settings?.apiKey || !state.voiceProfile);

  async function runAction(action: Action) {
    if (!state.settings?.apiKey) {
      setError("No API key configured. Add one in Settings.");
      return;
    }
    setStreaming(true);
    setOutput("");
    setError(null);

    const body = {
      action,
      topic: action === "draft" || action === "ideate" ? input : undefined,
      query: action === "search" ? input : undefined,
      draft: action === "check" ? input : undefined,
      posts: state.posts,
      voiceProfile: state.voiceProfile?.markdown ?? "",
      provider: state.settings.provider,
      model: state.settings.model,
      apiKey: state.settings.apiKey,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setOutput(buf);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setStreaming(false);
    }
  }

  if (state.loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Workspace
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          {state.posts.length > 0
            ? `${state.posts.length} post${state.posts.length === 1 ? "" : "s"} loaded.`
            : "No posts loaded yet."}{" "}
          {state.voiceProfile ? "Voice profile active." : "No voice profile."}{" "}
          {state.settings?.provider ? `Model: ${state.settings.model}.` : ""}
        </p>
      </div>

      {needsSetup && (
        <div className="card" style={{ borderColor: "var(--color-accent)" }}>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>One-time setup</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 12 }}>
            Add your API key, paste your voice profile, and (optionally) load your post corpus.
            All data stays in your browser.
          </p>
          <Link href="/settings" className="btn btn-primary">
            Open settings
          </Link>
        </div>
      )}

      {!selectedAction ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.875rem" }}>
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setSelectedAction(a.id);
                setInput("");
                setOutput("");
                setError(null);
              }}
              className="card"
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: "var(--color-bg-secondary)",
                transition: "border-color 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              disabled={needsSetup}
            >
              <p style={{ fontWeight: 500, marginBottom: 4 }}>{a.label}</p>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{a.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <ActionView
          action={ACTIONS.find((a) => a.id === selectedAction)!}
          input={input}
          setInput={setInput}
          output={output}
          streaming={streaming}
          error={error}
          onRun={() => runAction(selectedAction)}
          onBack={() => {
            setSelectedAction(null);
            setOutput("");
            setError(null);
          }}
        />
      )}
    </div>
  );
}

function ActionView({
  action,
  input,
  setInput,
  output,
  streaming,
  error,
  onRun,
  onBack,
}: {
  action: (typeof ACTIONS)[number];
  input: string;
  setInput: (s: string) => void;
  output: string;
  streaming: boolean;
  error: string | null;
  onRun: () => void;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}>{action.label}</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{action.description}</p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="card">
        <label className="label" htmlFor="input">
          {action.inputLabel}
        </label>
        {action.inputType === "draft" ? (
          <textarea
            id="input"
            className="textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={action.inputPlaceholder}
            rows={10}
          />
        ) : (
          <input
            id="input"
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={action.inputPlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !streaming) onRun();
            }}
          />
        )}
        <div style={{ marginTop: 12, display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button
            className="btn btn-primary"
            onClick={onRun}
            disabled={streaming || (action.inputType === "draft" && input.trim().length === 0)}
          >
            {streaming ? "Generating..." : "Run"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--color-accent)" }}>
          <p style={{ color: "var(--color-accent)", fontSize: 14, fontWeight: 500 }}>Error</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{error}</p>
        </div>
      )}

      {output && (
        <div className="card">
          <div className="output">{output}</div>
        </div>
      )}
    </div>
  );
}
