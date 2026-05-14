import { redirect } from "next/navigation";
import { QualityCheckView } from "@/components/actions/quality-check-view";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function QualityCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");
  const params = await searchParams;
  return <QualityCheckView defaultDraft={params.draft} />;
}
