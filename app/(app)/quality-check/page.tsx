import { redirect } from "next/navigation";
import { QualityCheckView } from "@/components/actions/quality-check-view";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function QualityCheckPage() {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");
  return <QualityCheckView />;
}
