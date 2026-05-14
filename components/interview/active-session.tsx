"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DIMENSIONS, DIMENSION_LABEL, type Dimension } from "@/lib/interview";

type Qa = {
  qaId: string;
  question: string;
  dimension: Dimension | null;
  answer: string;
  position: number;
};

export function ActiveSession({
  sessionId,
  initialQuestion,
}: {
  sessionId: string;
  initialQuestion: { qaId: string; question: string; dimension: Dimension | null; position: number };
}) {
  const router = useRouter();
  const [history, setHistory] = useState<Qa[]>([]);
  const [current, setCurrent] = useState<{
    qaId: string;
    question: string;
    dimension: Dimension | null;
    position: number;
  }>(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState<"none" | "next" | "wrap">("none");
  const [err, setErr] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, [current.qaId]);

  const coverage = computeCoverage(history, current);

  async function handleNext() {
    if (busy !== "none") return;
    if (answer.trim().length === 0) {
      setErr("Write an answer before moving on. If you'd rather stop, click Wrap up.");
      return;
    }
    setBusy("next");
    setErr(null);
    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, qaId: current.qaId, answer: answer.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const next = (await res.json()) as {
        qaId: string;
        question: string;
        dimension: Dimension | null;
        position: number;
      };
      setHistory((h) => [
        ...h,
        {
          qaId: current.qaId,
          question: current.question,
          dimension: current.dimension,
          answer: answer.trim(),
          position: current.position,
        },
      ]);
      setCurrent(next);
      setAnswer("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy("none");
    }
  }

  async function handleWrap() {
    if (busy !== "none") return;
    setBusy("wrap");
    setErr(null);
    try {
      const res = await fetch("/api/interview/end", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          qaId: current.qaId,
          answer: answer.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.push(`/interview/${sessionId}/summary`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
      setBusy("none");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <CoverageBar coverage={coverage} />

      <section className="card" aria-live="polite">
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Question {current.position}
          {current.dimension ? ` · ${DIMENSION_LABEL[current.dimension]}` : ""}
        </div>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            lineHeight: 1.4,
            margin: 0,
            color: "var(--color-fg)",
          }}
        >
          {current.question}
        </p>
      </section>

      <div>
        <Label htmlFor="answer">Your answer</Label>
        <Textarea
          id="answer"
          ref={taRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write as if you were talking to a peer. Specifics over abstractions."
          style={{ minHeight: 220 }}
          disabled={busy !== "none"}
        />
      </div>

      {err ? (
        <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
          {err}
        </p>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <span className="eyebrow">
          {history.length === 0
            ? "Tip: aim for 6 to 12 questions on a first run."
            : `${history.length + 1} answered so far. Wrap up any time.`}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="button"
            variant="ghost"
            onClick={handleWrap}
            streaming={busy === "wrap"}
            streamingLabel="Synthesizing"
            disabled={busy === "next"}
          >
            Wrap up
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            streaming={busy === "next"}
            streamingLabel="Generating"
            disabled={busy === "wrap"}
          >
            Save and next question
          </Button>
        </div>
      </div>

      {history.length > 0 ? (
        <details style={{ marginTop: 20 }}>
          <summary
            style={{
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-fg-faint)",
            }}
          >
            Prior answers ({history.length})
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {history.map((h) => (
              <article key={h.qaId} className="card" style={{ padding: "14px 16px" }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Q{h.position}
                  {h.dimension ? ` · ${DIMENSION_LABEL[h.dimension]}` : ""}
                </div>
                <p style={{ margin: 0, fontWeight: 500 }}>{h.question}</p>
                <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", color: "var(--color-fg-muted)" }}>
                  {h.answer}
                </p>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function computeCoverage(
  history: Qa[],
  current: { dimension: Dimension | null },
): Record<Dimension, number> {
  const out = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>;
  for (const h of history) {
    if (h.dimension) out[h.dimension] = (out[h.dimension] ?? 0) + 1;
  }
  // current question counts as touched but not answered; show it lightly
  return out;
}

function CoverageBar({ coverage }: { coverage: Record<Dimension, number> }) {
  return (
    <div
      role="group"
      aria-label="Dimension coverage"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${DIMENSIONS.length}, 1fr)`,
        gap: 8,
        marginBottom: 4,
      }}
    >
      {DIMENSIONS.map((d) => {
        const n = coverage[d];
        return (
          <div
            key={d}
            title={`${DIMENSION_LABEL[d]} · ${n} answer(s)`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
            }}
          >
            <div
              aria-hidden
              style={{
                height: 4,
                width: "100%",
                background: n > 0 ? "var(--color-accent)" : "var(--color-border)",
                borderRadius: 2,
                opacity: n === 0 ? 1 : Math.min(0.4 + n * 0.2, 1),
              }}
            />
            <span className="eyebrow" style={{ fontSize: 10 }}>
              {DIMENSION_LABEL[d]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
