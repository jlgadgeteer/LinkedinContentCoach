import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { listDrafts, type DraftSummary } from "@/lib/drafts";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<DraftSummary["status"], string> = {
  not_published: "Not published",
  scheduled: "Scheduled",
  published: "Published",
};

function statusVariant(s: DraftSummary["status"]): "success" | "danger" | undefined {
  if (s === "published") return "success";
  return undefined;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DraftsListPage() {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const all = await listDrafts();
  const scheduled = all.filter((d) => d.status === "scheduled");
  const notPublished = all.filter((d) => d.status === "not_published");
  const published = all.filter((d) => d.status === "published");

  return (
    <div className="content--wide">
      <PageHeader
        eyebrow="Drafts"
        title="All drafts"
        right={
          <>
            <Badge>{scheduled.length} scheduled</Badge>
            <Badge>{notPublished.length} unpublished</Badge>
          </>
        }
      />

      {all.length === 0 ? (
        <p className="muted" style={{ marginTop: 24 }}>
          No drafts yet. Drafts you generate from the{" "}
          <Link href="/draft">Draft</Link> action are saved here automatically.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 36, marginTop: 12 }}>
          {scheduled.length > 0 && (
            <Section title="Scheduled" drafts={scheduled} />
          )}
          {notPublished.length > 0 && (
            <Section title="Not published" drafts={notPublished} />
          )}
          {published.length > 0 && (
            <Section title="Published" drafts={published} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, drafts }: { title: string; drafts: DraftSummary[] }) {
  return (
    <section>
      <SectionHeader>{title}</SectionHeader>
      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {drafts.map((d) => (
          <li key={d.id}>
            <Link href={`/drafts/${d.id}`} className="card card--interactive" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
                <span className="card-title">{d.title}</span>
                <Badge variant={statusVariant(d.status)}>{STATUS_LABEL[d.status]}</Badge>
              </div>
              <p className="card-desc" style={{ marginTop: 8 }}>{d.excerpt}</p>
              <div className="eyebrow" style={{ marginTop: 10 }}>
                {d.scheduledFor ? `Scheduled · ${fmtDate(d.scheduledFor)}` : `Updated · ${fmtDate(d.updatedAt)}`}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
