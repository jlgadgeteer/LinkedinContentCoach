import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkedIn Content Coach",
  description: "Open-source LinkedIn writing tool. BYO API key. All data stays in your browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <header
            style={{
              borderBottom: "1px solid var(--color-border)",
              padding: "0.875rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--color-bg)",
            }}
          >
            <Link
              href="/"
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: "var(--color-text)",
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Coach
            </Link>
            <nav style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Link href="/" className="btn btn-ghost">Workspace</Link>
              <Link href="/settings" className="btn btn-ghost">Settings</Link>
            </nav>
          </header>
          <main style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: 880, width: "100%", margin: "0 auto" }}>
            {children}
          </main>
          <footer
            style={{
              borderTop: "1px solid var(--color-border)",
              padding: "0.875rem 1.5rem",
              fontSize: 12,
              color: "var(--color-text-subtle)",
              textAlign: "center",
            }}
          >
            All data lives in your browser. Your API key is sent per-request and never logged.
          </footer>
        </div>
      </body>
    </html>
  );
}
