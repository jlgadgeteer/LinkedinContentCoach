import { redirect } from "next/navigation";
import { DraftView } from "@/components/actions/draft-view";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function DraftPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const params = await searchParams;
  return <DraftView defaultTopic={params.topic} postCount={setup.postCount} />;
}
