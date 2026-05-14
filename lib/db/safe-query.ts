import "server-only";

/**
 * Postgres "undefined_table" (42P01) and "undefined_column" (42703) wrappers.
 * Used so the settings page and prompt assembler don't hard-fail when a
 * migration hasn't applied (or hasn't applied yet) on a given environment.
 * Returns the supplied default for those errors and re-throws anything else.
 */
export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingRelationOrColumn(err)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[content-coach] ${label}: missing relation/column; using fallback. ` +
          `Run /api/admin/migrate to apply pending schema changes.`,
      );
      return fallback;
    }
    throw err;
  }
}

export function isMissingRelationOrColumn(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  if (code === "42P01" || code === "42703") return true;
  // @vercel/postgres wraps errors; the underlying code may live on a cause.
  const cause = (err as { cause?: { code?: string } }).cause;
  if (cause && (cause.code === "42P01" || cause.code === "42703")) return true;
  // Fallback for environments where only the message is available.
  const message = (err as { message?: string }).message ?? "";
  return (
    /relation .* does not exist/i.test(message) ||
    /column .* does not exist/i.test(message)
  );
}
