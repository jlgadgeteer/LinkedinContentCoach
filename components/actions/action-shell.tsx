"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { OutputBlock, OutputPlaceholder } from "@/components/output/output-block";
import { PageHeader } from "@/components/ui/page-header";
import { FormattedOutput } from "@/components/actions/format-output";
import {
  approximateTokens,
  useStreamingAction,
  type ActionKind,
} from "@/hooks/use-streaming-action";

type Props = {
  kind: ActionKind;
  eyebrow: string;
  title: string;
  rightMeta?: React.ReactNode;
  /**
   * Build the payload to send. Receives the form values you collected and
   * returns the wire body for /api/generate.
   */
  buildPayload: () => {
    topic?: string;
    draft?: string;
    query?: string;
    mode?: string;
  } | null;
  /** Primary button label when idle. */
  primaryLabel: string;
  /** Streaming-state primary button label (e.g., "Drafting"). */
  primaryStreamingLabel: string;
  /** True when the input form has enough to submit. */
  canSubmit: boolean;
  /** The input form rendered above the action row. */
  children: React.ReactNode;
  /** Use formatted <post> rendering on the output. Off for Ideate / Search / QC. */
  formatPosts?: boolean;
  /**
   * Custom done-state output renderer (used by Ideate to render clickable
   * idea cards). When streaming or failed, the default rendering is used.
   */
  renderDone?: (text: string) => React.ReactNode;
};

export function ActionShell({
  kind,
  eyebrow,
  title,
  rightMeta,
  buildPayload,
  primaryLabel,
  primaryStreamingLabel,
  canSubmit,
  children,
  formatPosts,
  renderDone,
}: Props) {
  const { state, run, cancel } = useStreamingAction();
  const isStreaming = state.status === "streaming";
  const isDone = state.status === "done";
  const isFail = state.status === "fail";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    void run({ action: kind, ...payload });
  };

  // ⌘↵ to submit, Esc to cancel
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit && !isStreaming) {
        e.preventDefault();
        const payload = buildPayload();
        if (payload) void run({ action: kind, ...payload });
      }
      if (e.key === "Escape" && isStreaming) {
        e.preventDefault();
        cancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSubmit, isStreaming, buildPayload, run, cancel, kind]);

  const head = (
    <PageHeader eyebrow={eyebrow} title={title} right={rightMeta} />
  );

  return (
    <div className="content">
      {head}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {children}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <span className="eyebrow">{isStreaming ? "Esc to cancel" : "⌘↵ to submit"}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {state.status !== "idle" && (
              <Button
                variant="ghost"
                size="default"
                type="button"
                onClick={cancel}
                disabled={!isStreaming}
              >
                {isStreaming ? "Stop" : "Clear"}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              streaming={isStreaming}
              streamingLabel={primaryStreamingLabel}
            >
              {primaryLabel}
            </Button>
          </div>
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        {state.status === "idle" ? (
          <OutputPlaceholder>Output will appear here</OutputPlaceholder>
        ) : (
          <OutputBlock
            status={
              isStreaming ? "live" : isFail ? "fail" : "done"
            }
            label={
              isStreaming
                ? "Streaming"
                : isFail
                  ? `Request failed${state.error?.status ? ` · ${state.error.status}` : ""}`
                  : `Complete · ${approximateTokens(state.text)} tokens`
            }
          >
            {isFail && state.error?.message && (
              <p className="muted" style={{ marginBottom: 8 }}>{state.error.message}</p>
            )}
            {isDone && renderDone ? (
              renderDone(state.text)
            ) : formatPosts && isDone ? (
              <FormattedOutput text={state.text} />
            ) : (
              <div style={{ whiteSpace: "pre-wrap" }}>{state.text}</div>
            )}
          </OutputBlock>
        )}
      </div>
    </div>
  );
}
