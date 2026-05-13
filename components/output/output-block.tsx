"use client";

import * as React from "react";

export type OutputStatus = "live" | "done" | "fail";

type Props = {
  status: OutputStatus;
  label: React.ReactNode;
  /**
   * Text to render. When `status === "live"`, a blinking caret is appended.
   */
  children?: React.ReactNode;
  /** Right-side actions in the head (Stop / Copy / Quality check / Try again). */
  actions?: React.ReactNode;
  /** Minimum reserved height so the page doesn't shift on first token. */
  minHeight?: number;
  className?: string;
};

export function OutputBlock({
  status,
  label,
  children,
  actions,
  minHeight = 220,
  className,
}: Props) {
  const ariaBusy = status === "live";
  return (
    <section
      className={["output", className].filter(Boolean).join(" ")}
      style={{ minHeight }}
      aria-live={status === "live" ? "polite" : undefined}
      aria-busy={ariaBusy || undefined}
    >
      <header className="output-head">
        <span
          className={
            "output-meta " +
            (status === "live" ? "is-live" : status === "done" ? "is-done" : "is-fail")
          }
        >
          {label}
        </span>
        {actions ? <div className="output-actions">{actions}</div> : null}
      </header>
      <div className="output-body">
        {children}
        {status === "live" ? <span className="caret" aria-hidden="true" /> : null}
      </div>
    </section>
  );
}

/**
 * Empty-state placeholder shown before any action has run. Replaced by an
 * `OutputBlock` once streaming begins.
 */
export function OutputPlaceholder({ children = "Output will appear here" }: { children?: React.ReactNode }) {
  return <div className="output-placeholder">{children}</div>;
}
