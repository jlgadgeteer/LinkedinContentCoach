"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ActionKind = "draft" | "ideate" | "search" | "check";

export type ActionPayload = {
  action: ActionKind;
  topic?: string;
  draft?: string;
  query?: string;
};

export type StreamStatus = "idle" | "streaming" | "done" | "fail";

export type StreamState = {
  status: StreamStatus;
  text: string;
  durationMs: number;
  error: { status?: number; message?: string } | null;
};

const INITIAL: StreamState = {
  status: "idle",
  text: "",
  durationMs: 0,
  error: null,
};

async function readError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string; details?: unknown };
    return typeof json.error === "string" ? json.error : `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export function useStreamingAction() {
  const [state, setState] = useState<StreamState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number>(0);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  const run = useCallback(async (payload: ActionPayload) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    startedAtRef.current = Date.now();
    setState({ status: "streaming", text: "", durationMs: 0, error: null });

    let res: Response;
    try {
      res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        signal: ctrl.signal,
      });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setState((s) => ({
        ...s,
        status: "fail",
        durationMs: Date.now() - startedAtRef.current,
        error: { message: err instanceof Error ? err.message : "Network error" },
      }));
      return;
    }

    if (!res.ok || !res.body) {
      const msg = await readError(res);
      setState((s) => ({
        ...s,
        status: "fail",
        durationMs: Date.now() - startedAtRef.current,
        error: { status: res.status, message: msg },
      }));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setState({
          status: "streaming",
          text: acc,
          durationMs: Date.now() - startedAtRef.current,
          error: null,
        });
      }
    } catch (err) {
      if (ctrl.signal.aborted) {
        setState({
          status: "done",
          text: acc,
          durationMs: Date.now() - startedAtRef.current,
          error: null,
        });
        return;
      }
      setState({
        status: "fail",
        text: acc,
        durationMs: Date.now() - startedAtRef.current,
        error: { message: err instanceof Error ? err.message : "Stream error" },
      });
      return;
    }

    setState({
      status: "done",
      text: acc,
      durationMs: Date.now() - startedAtRef.current,
      error: null,
    });
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { state, run, cancel, reset };
}

export function approximateTokens(text: string): number {
  // Cheap estimate; the chat panel only uses this for display.
  return Math.max(1, Math.round(text.length / 4));
}
