import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function BareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header
        style={{
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <Link
          href="/"
          style={{ textDecoration: "none", color: "inherit" }}
          aria-label="Content Coach, home"
        >
          <div className="brand">
            Content Coach
            <small>v0.2 · personal</small>
          </div>
        </Link>
        <ThemeToggle />
      </header>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
