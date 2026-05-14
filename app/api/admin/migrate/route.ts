import { auth } from "@/lib/auth";
import { ensureSchemaFresh } from "@/lib/db/migrate";

// Node runtime: ensureSchema and @vercel/postgres connection pool are both
// Node-friendly. The migration is idempotent so this can be hit safely
// multiple times.
export const runtime = "nodejs";

async function run() {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  if (!process.env.POSTGRES_URL) {
    return new Response(
      JSON.stringify({ error: "POSTGRES_URL is not set on this deployment." }),
      { status: 412, headers: { "content-type": "application/json" } },
    );
  }
  try {
    const failures = await ensureSchemaFresh();
    return Response.json({
      ok: failures.length === 0,
      failures,
      message:
        failures.length === 0
          ? "Schema is up to date."
          : `${failures.length} statement(s) failed. The migration is idempotent; fix the underlying cause and POST again.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[content-coach] /api/admin/migrate crashed", err);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export const POST = run;
export const GET = run;
