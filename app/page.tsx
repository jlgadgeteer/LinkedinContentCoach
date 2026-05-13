/**
 * Workspace home. Replaced in Phase 6 with the designed 2x2 action grid.
 * For now this is a minimal placeholder so the root route resolves while
 * Phases 2 through 5 land.
 */
export default function HomePage() {
  return (
    <div className="content-wide">
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
        Workspace
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
        What are you writing today?
      </h1>
      <p
        style={{
          color: "var(--color-fg-muted)",
          marginTop: 16,
          maxWidth: "var(--content-prose)",
        }}
      >
        The four actions (Draft, Ideate, Search, Quality check) will live here.
        This page lands fully in Phase 6.
      </p>
    </div>
  );
}
