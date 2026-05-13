import { redirect } from "next/navigation";
import { WizardShell } from "@/components/setup/wizard-shell";
import { StepProviderForm } from "@/components/setup/step-provider-form";
import { StepVoiceForm } from "@/components/setup/step-voice-form";
import { StepPostsForm } from "@/components/setup/step-posts-form";
import { getSetupState, nextNeededStep } from "@/lib/setup";

type SearchParams = { step?: string | string[] };

function readStep(raw: string | string[] | undefined): 1 | 2 | 3 | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "1") return 1;
  if (v === "2") return 2;
  if (v === "3") return 3;
  return null;
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const state = await getSetupState();

  if (state.isComplete) redirect("/");

  const requested = readStep(params.step);
  const step = requested ?? nextNeededStep(state);
  if (!requested) redirect(`/setup?step=${step}`);

  return (
    <>
      {step === 1 && (
        <WizardShell
          step={1}
          title="Connect a model."
          lede="Bring your own Claude or OpenAI key. It's encrypted at rest and only used to send your prompts to the provider."
        >
          <StepProviderForm />
        </WizardShell>
      )}
      {step === 2 && (
        <WizardShell
          step={2}
          title="Write a voice profile."
          lede="A short markdown document the model reads before every draft. Tell it who you are, what you sound like, and what you don't do."
        >
          <StepVoiceForm />
        </WizardShell>
      )}
      {step === 3 && (
        <WizardShell
          step={3}
          title="Paste your post history."
          lede="An export of your past LinkedIn posts. The app uses these as examples and as a search corpus so you don't redraft something you already wrote."
        >
          <StepPostsForm />
        </WizardShell>
      )}
    </>
  );
}
