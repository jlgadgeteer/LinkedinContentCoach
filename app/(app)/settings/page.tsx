/**
 * Settings page. Replaced in Phase 8 with the four designed cards
 * (Provider, Voice profile, Post corpus, Backup). Minimal placeholder
 * here so the route resolves while the schema, auth, and primitives
 * phases land.
 */
export default function SettingsPage() {
  return (
    <div className="content-prose">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-fg-faint)",
          marginBottom: 12,
        }}
      >
        Settings
      </div>
      <h1
        className="serif"
        style={{
          fontSize: "var(--text-2xl)",
          lineHeight: "var(--text-2xl--line-height)",
          letterSpacing: "var(--tracking-tighter)",
          fontWeight: 500,
          margin: 0,
        }}
      >
        Provider, voice profile, post corpus, backup.
      </h1>
      <p
        style={{
          color: "var(--color-fg-muted)",
          marginTop: 16,
          maxWidth: "var(--content-prose)",
        }}
      >
        Configuration lands fully in Phase 8.
      </p>
    </div>
  );
}
