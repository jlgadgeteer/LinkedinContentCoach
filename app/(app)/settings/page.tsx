import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ProviderCard } from "@/components/settings/provider-card";
import { VoiceCard } from "@/components/settings/voice-card";
import { KnowledgeCard } from "@/components/settings/knowledge-card";
import { CorpusCard } from "@/components/settings/corpus-card";
import { BackupCard } from "@/components/settings/backup-card";
import { getSetupState } from "@/lib/setup";
import { getSettingsSnapshot } from "@/lib/settings";

export const dynamic = "force-dynamic";

function relative(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export default async function SettingsPage() {
  if (!process.env.POSTGRES_URL) {
    return (
      <div className="content">
        <PageHeader eyebrow="Settings" title="Database not configured" />
        <p className="muted" style={{ marginTop: 12 }}>
          Set <span className="mono">POSTGRES_URL</span> in your Vercel project to enable settings.
        </p>
      </div>
    );
  }

  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const snapshot = await getSettingsSnapshot();
  const lastSaved = relative(snapshot.lastSavedAt);

  return (
    <div className="content">
      <PageHeader
        eyebrow="Settings"
        title="Configure"
        right={lastSaved ? <Badge>Last saved {lastSaved}</Badge> : null}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <ProviderCard
          provider={snapshot.provider}
          model={snapshot.model}
          hasApiKey={snapshot.hasApiKey}
          lastVerifiedAt={snapshot.lastVerifiedAt}
        />
        <VoiceCard initial={snapshot.voiceProfileMarkdown} />
        <KnowledgeCard initial={snapshot.knowledgeProfileMarkdown} />
        <CorpusCard
          postCount={snapshot.postCount}
          oldest={snapshot.postDateRange.oldest}
          newest={snapshot.postDateRange.newest}
          indexedAt={snapshot.postsCreatedAt}
        />
        <BackupCard />
      </div>
    </div>
  );
}
