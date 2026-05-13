import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getSetupState } from "@/lib/setup";
import { formatRelative, getWorkspaceSummary } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const ACTIONS: { href: string; title: string; desc: string; kbd: string }[] = [
  {
    href: "/draft",
    title: "Draft a post",
    desc: "Write a post in your voice from a topic.",
    kbd: "⌘1",
  },
  {
    href: "/ideate",
    title: "Ideate",
    desc: "Five angles on a rough idea.",
    kbd: "⌘2",
  },
  {
    href: "/search",
    title: "Search past posts",
    desc: "Find what you've written before drafting something redundant.",
    kbd: "⌘3",
  },
  {
    href: "/quality-check",
    title: "Quality check",
    desc: "Surface AI tells, voice drift, and weak openings in a draft.",
    kbd: "⌘4",
  },
];

export default async function WorkspacePage() {
  if (!process.env.POSTGRES_URL) return <NoDbFallback />;

  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const summary = await getWorkspaceSummary();
  const showVoiceWarning = !summary.hasVoiceProfile;

  return (
    <div className="content--wide">
      {showVoiceWarning ? (
        <div style={{ marginBottom: 24 }}>
          <Banner
            tone="danger"
            title="No voice profile loaded"
            body="The model has no voice to imitate. Open Settings and paste a voice profile."
            actions={
              <Link href="/settings" className="btn btn--secondary btn--sm">
                Open settings
              </Link>
            }
          />
        </div>
      ) : null}
      <PageHeader
        eyebrow="Workspace"
        title="What are you writing today?"
        right={
          <>
            <Badge>{summary.postCount} posts loaded</Badge>
            {summary.hasVoiceProfile ? (
              <Badge variant="success">Voice profile active</Badge>
            ) : (
              <Badge variant="danger">No voice profile</Badge>
            )}
          </>
        }
      />

      <div className="actions">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="action">
            <div className="action__head">
              <span className="action__title">{a.title}</span>
              <span className="action__kbd">{a.kbd}</span>
            </div>
            <div className="action__desc">{a.desc}</div>
          </Link>
        ))}
      </div>

      {summary.recent.length === 0 ? (
        <p
          className="faint"
          style={{ marginTop: 32, fontSize: 12, lineHeight: 1.6 }}
        >
          Nothing here yet. Your drafts and checks will show up below once you run one.
        </p>
      ) : (
        <section className="recent" aria-label="Recent">
          <div className="recent__head">
            <SectionHeader>Recent</SectionHeader>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="recent__list">
            {summary.recent.map((r) => (
              <div key={r.id} className="recent__item">
                <span className="recent__when">{formatRelative(r.at)}</span>
                <span className="recent__title">{r.title}</span>
                <span className="recent__kind">{r.kind}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NoDbFallback() {
  return (
    <div className="content">
      <PageHeader eyebrow="Workspace" title="Database not configured" />
      <p className="muted" style={{ marginTop: 12 }}>
        Set <span className="mono">POSTGRES_URL</span> in your Vercel project to enable the
        workspace.
      </p>
    </div>
  );
}
