import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Content Coach",
  description:
    "Open-source LinkedIn writing tool. Self-hosted to Vercel, single user, your API key, your data.",
};

const NO_FLASH_THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');var d;if(!s||s==='system'){d=window.matchMedia('(prefers-color-scheme: dark)').matches;}else{d=s==='dark';}document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
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

          <main
            style={{
              flex: 1,
              padding: "32px",
              width: "100%",
            }}
          >
            {children}
          </main>

          <footer
            style={{
              padding: "20px 32px 28px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "var(--color-fg-faint)",
            }}
          >
            Self-hosted. Your API key and post history live in your own Vercel project.
          </footer>
        </div>
      </body>
    </html>
  );
}
