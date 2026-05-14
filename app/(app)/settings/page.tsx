import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ProviderCard } from "@/components/settings/provider-card";
import { VoiceCard } from "@/components/settings/voice-card";
import { KnowledgeCard } from "@/components/settings/knowledge-card";
import { CorpusCard } from "@/components/settings/corpus-card";
import { BackupCard } from "@/components/settings/backup-card";
import { QualityRulesCard } from "@/components/settings/quality-rules-card";
import { WritingModesCard } from "@/components/settings/writing-modes-card";
import { ActionSettingsCard } from "@/components/settings/action-settings-card";
import { getSetupState } from "@/lib/setup";
import { getSettingsSnapshot } from "@/lib/settings";
import { getQualityRulesMarkdown } from "@/lib/quality-rules";
import { listWritingModes } from "@/lib/writing-modes";
import { getActionSettings } from "@/lib/action-settings";

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

  const [snapshot, qualityRules, modes, actionSettings] = await Promise.all([
    getSettingsSnapshot(),
    getQualityRulesMarkdown(),
    listWritingModes(),
    getActionSettings(),
  ]);
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
        <QualityRulesCard initial={qualityRules} />
        <WritingModesCard
          modes={modes.map((m) => ({
            id: m.id,
            slug: m.slug,
            name: m.name,
            markdown: m.markdown,
          }))}
        />
        <ActionSettingsCard initial={actionSettings} baseModel={snapshot.model} />
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
