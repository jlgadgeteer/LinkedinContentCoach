"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; kbd?: string };

const ACTIONS: NavItem[] = [
  { href: "/draft", label: "Draft", kbd: "⌘1" },
  { href: "/ideate", label: "Ideate", kbd: "⌘2" },
  { href: "/search", label: "Search", kbd: "⌘3" },
  { href: "/quality-check", label: "Quality check", kbd: "⌘4" },
];

const MANAGE: NavItem[] = [{ href: "/settings", label: "Settings" }];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="app__nav">
      <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="brand">
          Content Coach
          <small>v0.2 · personal</small>
        </div>
      </Link>

      <nav className="nav-section" aria-label="Actions">
        <span className="nav-section__label">Actions</span>
        {ACTIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "nav-item" + (isActive(pathname, item.href) ? " nav-item--active" : "")
            }
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
          >
            <span>{item.label}</span>
            {item.kbd ? <span className="nav-item__kbd">{item.kbd}</span> : null}
          </Link>
        ))}
      </nav>

      <nav className="nav-section" aria-label="Manage">
        <span className="nav-section__label">Manage</span>
        {MANAGE.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "nav-item" + (isActive(pathname, item.href) ? " nav-item--active" : "")
            }
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="nav-foot">
        <ThemeToggle />
        <span style={{ marginTop: 12 }}>github.com/your-org/content-coach</span>
      </div>
    </aside>
  );
}
