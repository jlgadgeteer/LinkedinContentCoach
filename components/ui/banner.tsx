import * as React from "react";

type Tone = "danger" | "neutral";

type Props = {
  tone?: Tone;
  title: React.ReactNode;
  body?: React.ReactNode;
  actions?: React.ReactNode;
};

/**
 * Inline banner for global notifications, e.g. a 401 from the provider.
 * Per design Section 10: 6px tone-colored dot, title + body, right-side
 * actions. Background is the tone-soft surface with a 30%-mixed border.
 */
export function Banner({ tone = "danger", title, body, actions }: Props) {
  const className = "banner" + (tone === "neutral" ? " banner--neutral" : "");
  return (
    <div className={className} role="status">
      <span className="banner__dot" aria-hidden="true" />
      <div>
        <div className="banner__title">{title}</div>
        {body ? <div className="banner__body">{body}</div> : null}
      </div>
      {actions ? <div className="banner__actions">{actions}</div> : null}
    </div>
  );
}
