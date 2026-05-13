import * as React from "react";

type Props = {
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * The one editorial moment per screen. Renders the model's <post>...</post>
 * block in Source Serif with a 3px terracotta left border and a mono meta
 * line above (e.g., "Draft · 184 words").
 */
export function PostBlock({ meta, children, className }: Props) {
  return (
    <article className={["post", className].filter(Boolean).join(" ")}>
      {meta ? <span className="post-meta">{meta}</span> : null}
      {children}
    </article>
  );
}
