import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ActiveSession } from "@/components/interview/active-session";
import { cancelInterviewSessionAction } from "@/lib/interview-actions";
import { getSessionDetail } from "@/lib/interview";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const { id } = await params;
  const detail = await getSessionDetail(id);
  if (!detail) notFound();

  if (detail.status !== "active") {
    redirect(`/interview/${id}/summary`);
  }

  // The latest unanswered question is the "current" one for the UI.
  const sortedQa = [...detail.qa].sort((a, b) => a.position - b.position);
  const lastQa = sortedQa[sortedQa.length - 1];
  if (!lastQa) {
    // Edge case: session exists but no question was generated. Treat it as
    // broken and let the user start over.
    return (
      <div className="content">
        <PageHeader eyebrow="Interview Me" title="Session has no questions yet" />
        <p className="muted" style={{ marginTop: 12 }}>
          Something went wrong generating the first question. Cancel this session and start a new one.
        </p>
        <form action={cancelInterviewSessionAction} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={detail.id} />
          <button type="submit" className="btn btn--secondary btn--sm">
            Cancel session
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="content">
      <PageHeader
        eyebrow="Interview Me · in progress"
        title="Tell me about yourself"
        right={<Badge>Question {lastQa.position}</Badge>}
      />
      <ActiveSession
        sessionId={detail.id}
        initialQuestion={{
          qaId: lastQa.id,
          question: lastQa.question,
          dimension: lastQa.dimension,
          position: lastQa.position,
        }}
      />
      <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/interview" className="btn btn--ghost btn--sm">
          Back to sessions
        </Link>
        <form action={cancelInterviewSessionAction}>
          <input type="hidden" name="id" value={detail.id} />
          <button
            type="submit"
            className="btn btn--ghost btn--sm"
            style={{ color: "var(--color-danger)" }}
          >
            Cancel session
          </button>
        </form>
      </div>
    </div>
  );
}
