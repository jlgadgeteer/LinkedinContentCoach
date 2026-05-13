"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the server console for the maintainer to find in Vercel logs.
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Error
        </div>
        <h1
          className="serif"
          style={{
            fontSize: 32,
            lineHeight: 1.15,
            letterSpacing: "var(--tracking-tighter)",
            fontWeight: 400,
            marginBottom: 12,
          }}
        >
          Something went sideways.
        </h1>
        <p className="muted" style={{ marginBottom: 12, lineHeight: 1.55 }}>
          The error has been logged to your Vercel project. Try the action again, and if it
          keeps failing, check your provider's status page and your AUTH_PASSWORD / POSTGRES_URL
          env vars.
        </p>
        {error.digest ? (
          <p className="mono faint" style={{ fontSize: 11, marginBottom: 24 }}>
            digest · {error.digest}
          </p>
        ) : (
          <div style={{ height: 24 }} />
        )}
        <Button variant="secondary" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
