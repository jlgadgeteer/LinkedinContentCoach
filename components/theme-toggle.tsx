"use client";

import { useEffect, useState } from "react";

type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return choice;
}

function apply(choice: ThemeChoice) {
  const resolved = resolve(choice);
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice | null) ?? "system";
    setChoice(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (choice !== "system" || typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [choice]);

  const select = (next: ThemeChoice) => {
    setChoice(next);
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  };

  const options: { value: ThemeChoice; label: string }[] = [
    { value: "system", label: "System" },
    { value: "light",  label: "Light"  },
    { value: "dark",   label: "Dark"   },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 2,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
      }}
    >
      {options.map((opt) => {
        const active = mounted && choice === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => select(opt.value)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              background: active ? "var(--color-accent-soft)" : "transparent",
              color: active ? "var(--color-fg)" : "var(--color-fg-faint)",
              transition: "background-color 120ms ease, color 120ms ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
