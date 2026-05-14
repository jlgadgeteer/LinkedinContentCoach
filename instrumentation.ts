/**
 * Next.js boot-time hook. Runs once per Node worker; skipped on edge.
 * Bootstraps the Postgres schema if POSTGRES_URL is configured.
 * When the env var is missing (e.g., a fresh `npm run dev` before the user
 * wires up Vercel Postgres), we no-op so the app still boots and the
 * setup flow can guide them.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.POSTGRES_URL) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[content-coach] POSTGRES_URL is not set. Skipping schema bootstrap. " +
          "Set it in .env.local to enable the database.",
      );
    }
    return;
  }

  try {
    const { ensureSchema } = await import("@/lib/db/migrate");
    const failures = await ensureSchema();
    if (failures.length > 0) {
      console.warn(
        `[content-coach] ${failures.length} migration statement(s) failed; ` +
          "the app will continue with defaults where possible. " +
          "Hit POST /api/admin/migrate to retry.",
        failures,
      );
    }
  } catch (err) {
    console.error("[content-coach] ensureSchema crashed", err);
  }
}
