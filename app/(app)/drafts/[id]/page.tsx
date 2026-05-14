import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DraftEditor } from "@/components/drafts/draft-editor";
import { getDraftById } from "@/lib/drafts";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  not_published: "Not published",
  scheduled: "Scheduled",
  published: "Published",
} as const;

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const { id } = await params;
  const draft = await getDraftById(id);
  if (!draft) notFound();

  return (
    <div className="content">
      <PageHeader
        eyebrow="Draft"
        title={draft.title}
        right={<Badge>{STATUS_LABEL[draft.status]}</Badge>}
      />
      <DraftEditor
        id={draft.id}
        initialTitle={draft.title}
        initialBody={draft.body}
        initialStatus={draft.status}
        initialScheduledFor={draft.scheduledFor}
      />
    </div>
  );
}
