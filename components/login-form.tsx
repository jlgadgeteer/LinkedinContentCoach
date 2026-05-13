"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type ErrorKind = "wrong-password" | "rate-limited" | "unknown" | null;

export function LoginForm({ from }: { from: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);

    const res = await signIn("credentials", {
      password,
      redirect: false,
    });

    setBusy(false);

    if (res?.error) {
      const code = res.code as string | undefined;
      if (code === "rate-limited") setError("rate-limited");
      else if (code === "wrong-password") setError("wrong-password");
      else setError("unknown");
      return;
    }

    window.location.href = from || "/";
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label
        htmlFor="pw"
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-fg-muted)",
          marginBottom: 8,
        }}
      >
        Password
      </label>
      <input
        id="pw"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        required
        aria-invalid={error === "wrong-password" || error === "rate-limited"}
        aria-describedby={error ? "login-error" : undefined}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          color: "var(--color-fg)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-md)",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={busy || !password}
        style={{
          width: "100%",
          marginTop: 16,
          height: 44,
          padding: "0 16px",
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          fontWeight: 500,
          color: "var(--color-accent-fg)",
          background: "var(--color-accent)",
          border: "1px solid var(--color-accent)",
          borderRadius: "var(--radius-md)",
          cursor: busy ? "wait" : "pointer",
          opacity: busy || !password ? 0.6 : 1,
          transition: "background-color 120ms ease, opacity 120ms ease",
        }}
      >
        {busy ? "Continuing" : "Continue"}
      </button>
      {error && (
        <p
          id="login-error"
          role="alert"
          style={{
            marginTop: 16,
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--color-danger)",
          }}
        >
          {error === "wrong-password" && "That password didn't match. Try again."}
          {error === "rate-limited" &&
            "Too many attempts from this address. Wait a minute and try again."}
          {error === "unknown" &&
            "Sign-in failed. Confirm POSTGRES_URL is configured for this instance."}
        </p>
      )}
    </form>
  );
}
