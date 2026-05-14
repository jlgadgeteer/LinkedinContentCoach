import { redirect } from "next/navigation";
import { IdeateView } from "@/components/actions/ideate-view";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function IdeatePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");
  const params = await searchParams;
  return <IdeateView defaultTopic={params.topic} />;
}
