"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MAP: Record<string, string> = {
  "1": "/draft",
  "2": "/ideate",
  "3": "/search",
  "4": "/quality-check",
};

/**
 * Listens for ⌘1-⌘4 (or Ctrl+1-4 on non-mac) and navigates. Mounted at the
 * app layout so it's active on every authenticated page.
 */
export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = MAP[e.key];
      if (!target) return;
      // Don't hijack browser shortcuts when the user is typing in a field
      // unless they've also chorded with Shift to make intent explicit.
      const t = e.target as HTMLElement | null;
      const inField =
        !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (inField && !e.shiftKey) return;
      e.preventDefault();
      router.push(target);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
