import { redirect } from "next/navigation";
import { SearchView } from "@/components/actions/search-view";
import { getSetupState } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");
  return <SearchView />;
}
