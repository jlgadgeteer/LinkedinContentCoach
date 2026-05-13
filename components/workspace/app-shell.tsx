"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/workspace/sidebar";
import { KeyboardShortcuts } from "@/components/workspace/keyboard-shortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Esc closes the drawer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app" data-mobile-nav-open={navOpen ? "true" : undefined}>
      <Sidebar />
      <main className="app__main">
        <div className="mobile-bar">
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
            aria-controls="app-sidebar"
            className="btn btn--ghost btn--sm"
            style={{ paddingLeft: 0 }}
          >
            Menu
          </button>
          <div
            className="brand"
            style={{ fontSize: 15, display: "flex", alignItems: "baseline", gap: 8 }}
          >
            Content Coach
          </div>
        </div>
        {children}
      </main>
      {navOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "transparent",
            border: "none",
            zIndex: 19,
            cursor: "pointer",
          }}
        />
      ) : null}
      <KeyboardShortcuts />
    </div>
  );
}
