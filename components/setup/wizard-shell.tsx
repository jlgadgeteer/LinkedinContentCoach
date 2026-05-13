import * as React from "react";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Step 01 · Model",
  2: "Step 02 · Voice",
  3: "Step 03 · Posts",
};

export function WizardShell({
  step,
  title,
  lede,
  children,
}: {
  step: Step;
  title: React.ReactNode;
  lede: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="wizard" aria-labelledby="wizard-title">
      <div
        className="eyebrow"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}
      >
        <span>Setup</span>
        <span>{STEP_LABELS[step]} · of 03</span>
      </div>

      <div className="wizard__steps" aria-hidden="true">
        {[1, 2, 3].map((n) => {
          const cls =
            n < step
              ? "wizard__step wizard__step--done"
              : n === step
                ? "wizard__step wizard__step--active"
                : "wizard__step";
          return (
            <div key={n} className={cls}>
              {STEP_LABELS[n as Step]}
            </div>
          );
        })}
      </div>

      <h1 id="wizard-title" className="wizard__title">
        {title}
      </h1>
      <p className="wizard__lede">{lede}</p>

      {children}
    </section>
  );
}
