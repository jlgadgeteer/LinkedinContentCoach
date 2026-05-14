import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { FormattedOutput } from "@/components/actions/format-output";
import { getSetupState } from "@/lib/setup";
import { getRecentById, resumeHref } from "@/lib/recents";
import { formatRelative } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IDEATE: "Ideate",
  SEARCH: "Search",
  QC: "Quality check",
};

export default async function RecentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const row = await getRecentById(id);
  if (!row) notFound();

  const action = row.action;
  const inputLabel =
    action === "draft" || action === "ideate"
      ? "Topic"
      : action === "search"
        ? "Query"
        : action === "check"
          ? "Draft"
          : "Input";
  const inputValue =
    action === "draft" || action === "ideate"
      ? row.inputTopic
      : action === "search"
        ? row.inputQuery
        : action === "check"
          ? row.inputDraft
          : null;

  return (
    <div className="content">
      <PageHeader
        eyebrow={`Recent · ${KIND_LABEL[row.kind] ?? row.kind}`}
        title={row.title}
        right={<Badge>{formatRelative(row.at)}</Badge>}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {inputValue ? (
          <section>
            <h2 className="eyebrow" style={{ marginBottom: 6 }}>
              {inputLabel}
            </h2>
            <div className="card" style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
              {inputValue}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="eyebrow" style={{ marginBottom: 6 }}>
            Output
          </h2>
          <div className="card" style={{ fontSize: 14 }}>
            {row.output ? (
              row.kind === "DRAFT" ? (
                <FormattedOutput text={row.output} />
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>{row.output}</div>
              )
            ) : (
              <span className="muted">
                Output was not saved. The stream may have failed before completing.
                Re-run to regenerate.
              </span>
            )}
          </div>
        </section>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {row.draftId ? (
            <Link
              href={`/drafts/${row.draftId}`}
              className="btn btn--primary btn--sm"
            >
              Open as draft
            </Link>
          ) : null}
          <Link href={resumeHref(row)} className="btn btn--secondary btn--sm">
            Re-run with same input
          </Link>
          <Link href="/" className="btn btn--ghost btn--sm">
            Back to workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
