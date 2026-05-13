import Link from "next/link";

export default function NotFound() {
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
      <div style={{ maxWidth: 420 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          404
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
          Nothing here.
        </h1>
        <p className="muted" style={{ marginBottom: 24, lineHeight: 1.55 }}>
          That path doesn't match a screen in this app. The workspace is the home.
        </p>
        <Link href="/" className="btn btn--secondary">
          Back to workspace
        </Link>
      </div>
    </div>
  );
}
