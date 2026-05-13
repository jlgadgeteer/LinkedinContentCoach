import { redirect } from "next/navigation";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

/**
 * Workspace home. Replaced in Phase 6 with the designed 2x2 action grid.
 * For now this is a minimal placeholder while the design phases land.
 * Redirects to /setup if the user hasn't completed first-run setup.
 */
export default async function HomePage() {
  if (process.env.POSTGRES_URL) {
    const state = await getSetupState();
    if (!state.isComplete) redirect("/setup");
  }

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
