"use client";

import { useEffect, useState } from "react";
import {
  addPosts,
  clearPosts,
  exportAll,
  getAllPosts,
  getSettings,
  getVoiceProfile,
  importAll,
  saveSettings,
  saveVoiceProfile,
} from "@/lib/db";
import { MODEL_OPTIONS, type Post, type Provider, type Settings, type VoiceProfile } from "@/lib/types";

type Status = { kind: "idle" } | { kind: "success"; message: string } | { kind: "error"; message: string };

export default function SettingsPage() {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [model, setModel] = useState<string>(MODEL_OPTIONS.anthropic[0].id);
  const [apiKey, setApiKey] = useState("");
  const [voiceMarkdown, setVoiceMarkdown] = useState("");
  const [postsCount, setPostsCount] = useState(0);
  const [postsJson, setPostsJson] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [settings, voice, posts] = await Promise.all([
        getSettings(),
        getVoiceProfile(),
        getAllPosts(),
      ]);
      if (settings) {
        setProvider(settings.provider);
        setModel(settings.model);
        setApiKey(settings.apiKey);
      }
      if (voice) setVoiceMarkdown(voice.markdown);
      setPostsCount(posts.length);
      setLoading(false);
    })();
  }, []);

  async function handleSaveSettings() {
    try {
      await saveSettings({ provider, model, apiKey, voiceProfileId: "default" });
      setStatus({ kind: "success", message: "Settings saved." });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Save failed" });
    }
  }

  async function handleSaveVoice() {
    try {
      await saveVoiceProfile(voiceMarkdown);
      setStatus({ kind: "success", message: "Voice profile saved." });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Save failed" });
    }
  }

  async function handleImportPosts() {
    try {
      const parsed = JSON.parse(postsJson) as Post[];
      if (!Array.isArray(parsed)) throw new Error("Expected an array of posts");
      await addPosts(parsed);
      const updated = await getAllPosts();
      setPostsCount(updated.length);
      setPostsJson("");
      setStatus({ kind: "success", message: `Imported ${parsed.length} posts.` });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Import failed" });
    }
  }

  async function handleClearPosts() {
    if (!confirm("Delete all loaded posts? This cannot be undone.")) return;
    await clearPosts();
    setPostsCount(0);
    setStatus({ kind: "success", message: "Post corpus cleared." });
  }

  async function handleExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coach-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportBackup(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAll(data);
      const updated = await getAllPosts();
      setPostsCount(updated.length);
      const voice = await getVoiceProfile();
      if (voice) setVoiceMarkdown(voice.markdown);
      setStatus({ kind: "success", message: "Backup imported." });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Import failed" });
    }
  }

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          Everything you configure here is saved in your browser. Your API key never leaves your device except when sent to your chosen provider.
        </p>
      </div>

      {status.kind !== "idle" && (
        <div
          className="card"
          style={{
            borderColor: status.kind === "success" ? "var(--color-accent)" : "var(--color-accent)",
            background: "var(--color-bg-secondary)",
          }}
        >
          <p style={{ fontSize: 14 }}>{status.message}</p>
        </div>
      )}

      <section className="card">
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Provider & API key</h2>

        <label className="label">Provider</label>
        <select
          className="select"
          value={provider}
          onChange={(e) => {
            const p = e.target.value as Provider;
            setProvider(p);
            setModel(MODEL_OPTIONS[p][0].id);
          }}
        >
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI</option>
        </select>

        <label className="label" style={{ marginTop: 12 }}>Model</label>
        <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
          {MODEL_OPTIONS[provider].map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <label className="label" style={{ marginTop: 12 }}>API key</label>
        <input
          type="password"
          className="input"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider === "anthropic" ? "sk-ant-..." : "sk-..."}
        />
        <p style={{ fontSize: 12, color: "var(--color-text-subtle)", marginTop: 6 }}>
          Stored in IndexedDB on this device. Sent to the API route per-request. Never logged.
        </p>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            Save settings
          </button>
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Voice profile</h2>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12 }}>
          Paste your voice profile markdown. This is the file that encodes how you actually write: banned phrases, hook patterns, themes, and tone. The coach treats this as authoritative.
        </p>
        <textarea
          className="textarea"
          value={voiceMarkdown}
          onChange={(e) => setVoiceMarkdown(e.target.value)}
          placeholder="# Voice Profile&#10;&#10;## Who I am&#10;&#10;..."
          rows={16}
        />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleSaveVoice}>
            Save voice profile
          </button>
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Post corpus</h2>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12 }}>
          {postsCount > 0
            ? `${postsCount} posts loaded.`
            : "No posts loaded. Paste the JSON output from the parser script below, or use the backup import."}
        </p>
        <textarea
          className="textarea"
          value={postsJson}
          onChange={(e) => setPostsJson(e.target.value)}
          placeholder='[{"id":"1","date":"2026-03-15","url":"...","hook":"...","text":"...","wordCount":120,"createdAt":1234567890}]'
          rows={6}
        />
        <div style={{ marginTop: 12, display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={handleClearPosts} disabled={postsCount === 0}>
            Clear corpus
          </button>
          <button className="btn btn-primary" onClick={handleImportPosts} disabled={postsJson.trim().length === 0}>
            Import posts
          </button>
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Backup & restore</h2>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12 }}>
          Export everything as JSON (excluding your API key) or restore from a previous export.
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export backup
          </button>
          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            Import backup
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportBackup(f);
              }}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
