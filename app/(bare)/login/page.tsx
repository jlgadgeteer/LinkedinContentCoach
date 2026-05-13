import { LoginForm } from "@/components/login-form";

type SearchParams = { from?: string | string[] };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const fromRaw = Array.isArray(params.from) ? params.from[0] : params.from;
  const from = fromRaw && fromRaw.startsWith("/") ? fromRaw : "/";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "100%",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "40px 40px 32px",
        }}
      >
        <h1
          className="serif"
          style={{
            fontSize: 32,
            lineHeight: 1.15,
            letterSpacing: "var(--tracking-tighter)",
            fontWeight: 400,
            color: "var(--color-fg)",
            marginBottom: 8,
          }}
        >
          Welcome back.
        </h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--color-fg-muted)",
            marginBottom: 28,
          }}
        >
          Your personal instance. Sign in with the password you set during deploy.
        </p>

        <LoginForm from={from} />

        <p
          className="mono"
          style={{
            fontSize: 11,
            lineHeight: 1.6,
            letterSpacing: "0.02em",
            color: "var(--color-fg-faint)",
            marginTop: 24,
          }}
        >
          Self-hosted. Not a public service.
          <br />
          Forgot it? Reset in your Vercel project's environment variables.
        </p>
      </div>

      <div
        className="mono"
        style={{
          position: "absolute",
          bottom: 8,
          right: 24,
          fontSize: 11,
          color: "var(--color-fg-faint)",
        }}
      >
        github.com/your-org/content-coach
      </div>
    </div>
  );
}
