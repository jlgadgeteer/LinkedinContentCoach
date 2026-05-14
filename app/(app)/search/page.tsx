import { redirect } from "next/navigation";
import { SearchView } from "@/components/actions/search-view";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");
  const params = await searchParams;
  return <SearchView defaultQuery={params.query} />;
}
