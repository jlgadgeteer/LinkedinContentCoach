import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { StartInterviewButton } from "@/components/interview/start-button";
import { listSessions } from "@/lib/interview";
import { getKnowledgeMarkdown } from "@/lib/knowledge";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  active: "In progress",
  ended: "Awaiting review",
  applied: "Applied",
  cancelled: "Cancelled",
} as const;

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function InterviewPage() {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const [sessions, knowledge] = await Promise.all([
    listSessions(),
    getKnowledgeMarkdown(),
  ]);
  const hasKnowledge = knowledge.trim().length > 0;
  const ctaLabel = hasKnowledge ? "Run a follow-up interview" : "Start your first interview";

  return (
    <div className="content">
      <PageHeader
        eyebrow="Interview Me"
        title="Build your knowledge profile"
        right={hasKnowledge ? <Badge variant="success">Knowledge loaded</Badge> : <Badge>No knowledge yet</Badge>}
      />

      <p className="muted" style={{ marginBottom: 18, fontSize: 14, lineHeight: 1.6, maxWidth: "60ch" }}>
        A short interview captures your background, expertise, opinions, audience, recent work, and the
        anti-patterns you've seen. Each session updates your voice profile and knowledge profile, which feed
        every Draft, Ideate, Search, and Quality Check action. Run it once to bootstrap, then again whenever
        you want the model to reflect what's changed.
      </p>

      <div style={{ marginBottom: 32 }}>
        <StartInterviewButton label={ctaLabel} />
      </div>

      <SectionHeader>Past sessions</SectionHeader>
      {sessions.length === 0 ? (
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          No sessions yet. The first one is a 10 to 15 minute investment that pays off across every
          subsequent draft.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "12px 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {sessions.map((s) => {
            const href = s.status === "active"
              ? `/interview/${s.id}`
              : `/interview/${s.id}/summary`;
            return (
              <li key={s.id}>
                <Link
                  href={href}
                  className="card card--interactive"
                  style={{ display: "block", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span className="card-title">Session · {fmt(s.startedAt)}</span>
                    <Badge variant={s.status === "applied" ? "success" : undefined}>
                      {STATUS_LABEL[s.status]}
                    </Badge>
                  </div>
                  <p className="card-desc" style={{ marginTop: 8 }}>
                    {s.summary ?? `${s.questionsCount} question${s.questionsCount === 1 ? "" : "s"} asked.`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
