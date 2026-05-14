import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import {
  applyInterviewSynthesisAction,
  discardInterviewSynthesisAction,
} from "@/lib/interview-actions";
import { DIMENSION_LABEL, getSessionDetail } from "@/lib/interview";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  active: "In progress",
  ended: "Awaiting your review",
  applied: "Applied",
  cancelled: "Cancelled",
} as const;

export default async function InterviewSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const { id } = await params;
  const { applied } = await searchParams;
  const detail = await getSessionDetail(id);
  if (!detail) notFound();

  if (detail.status === "active") {
    redirect(`/interview/${id}`);
  }

  return (
    <div className="content">
      <PageHeader
        eyebrow="Interview Me · summary"
        title={detail.summary ?? "Session ended"}
        right={<Badge variant={detail.status === "applied" ? "success" : undefined}>{STATUS_LABEL[detail.status]}</Badge>}
      />

      {applied ? (
        <div style={{ marginTop: 12, marginBottom: 20 }}>
          <Banner
            tone="neutral"
            title="Profiles updated"
            body="Your voice profile and knowledge profile now reflect this session. Open Settings to view or edit them."
            actions={
              <Link href="/settings" className="btn btn--secondary btn--sm">
                Open settings
              </Link>
            }
          />
        </div>
      ) : null}

      {detail.status === "ended" ? (
        <ProposedDocs
          sessionId={detail.id}
          proposedVoice={detail.proposedVoiceProfile ?? ""}
          proposedKnowledge={detail.proposedKnowledge ?? ""}
        />
      ) : (
        <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>
          {detail.status === "applied"
            ? "Synthesis was applied. Find the updated profiles in Settings."
            : "This session was cancelled. Start a new one from the Interview page."}
        </p>
      )}

      <section style={{ marginTop: 36 }}>
        <SectionHeader>Questions in this session</SectionHeader>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "12px 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {detail.qa.map((q) => (
            <li key={q.id} className="card" style={{ padding: "14px 16px" }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Q{q.position}
                {q.dimension ? ` · ${DIMENSION_LABEL[q.dimension]}` : ""}
              </div>
              <p style={{ margin: 0, fontWeight: 500 }}>{q.question}</p>
              {q.answer ? (
                <p
                  style={{
                    margin: "8px 0 0",
                    whiteSpace: "pre-wrap",
                    color: "var(--color-fg-muted)",
                  }}
                >
                  {q.answer}
                </p>
              ) : (
                <p className="faint" style={{ marginTop: 8, fontSize: 12 }}>
                  (no answer)
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div style={{ marginTop: 28 }}>
        <Link href="/interview" className="btn btn--ghost btn--sm">
          Back to sessions
        </Link>
      </div>
    </div>
  );
}

function ProposedDocs({
  sessionId,
  proposedVoice,
  proposedKnowledge,
}: {
  sessionId: string;
  proposedVoice: string;
  proposedKnowledge: string;
}) {
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 24 }}>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: "60ch" }}>
        The model proposed updated voice and knowledge profiles based on what you said. Review them
        below. Apply to overwrite the live versions, or discard to leave your existing profiles
        untouched.
      </p>

      <DocPanel title="Proposed voice profile" body={proposedVoice} />
      <DocPanel title="Proposed knowledge profile" body={proposedKnowledge} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <form action={applyInterviewSynthesisAction}>
          <input type="hidden" name="id" value={sessionId} />
          <button type="submit" className="btn btn--primary">
            Apply changes
          </button>
        </form>
        <form action={discardInterviewSynthesisAction}>
          <input type="hidden" name="id" value={sessionId} />
          <button type="submit" className="btn btn--ghost">
            Discard
          </button>
        </form>
      </div>
    </div>
  );
}

function DocPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="card" aria-label={title}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="card-title">{title}</span>
        <span className="eyebrow">{body.split(/\s+/).filter(Boolean).length} words</span>
      </div>
      <pre
        style={{
          marginTop: 12,
          whiteSpace: "pre-wrap",
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.55,
          color: "var(--color-fg-muted)",
          maxHeight: 320,
          overflow: "auto",
          background: "var(--color-surface-alt, transparent)",
          padding: 12,
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border)",
        }}
      >
        {body || "(empty)"}
      </pre>
    </section>
  );
}
