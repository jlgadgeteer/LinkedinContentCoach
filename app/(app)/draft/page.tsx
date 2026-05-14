import { redirect } from "next/navigation";
import { DraftView } from "@/components/actions/draft-view";
import { getSetupState } from "@/lib/setup";
import { listWritingModes } from "@/lib/writing-modes";

export const dynamic = "force-dynamic";

export default async function DraftPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; mode?: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const params = await searchParams;
  const modes = await listWritingModes();
  return (
    <DraftView
      defaultTopic={params.topic}
      defaultMode={params.mode}
      postCount={setup.postCount}
      modes={modes.map((m) => ({ slug: m.slug, name: m.name }))}
    />
  );
}
