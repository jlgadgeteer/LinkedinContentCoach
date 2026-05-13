import * as React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  /** Render as a different element, e.g. `as="a"` for an action card link. */
  as?: keyof React.JSX.IntrinsicElements;
};

export function Card({ interactive, as = "div", className, children, ...rest }: Props) {
  const Tag = as as keyof React.JSX.IntrinsicElements;
  const classes = ["card", interactive && "card--interactive", className]
    .filter(Boolean)
    .join(" ");
  // The intrinsic Tag signature varies per element; rest props are spread as-is.
  return React.createElement(
    Tag,
    { className: classes, ...(rest as Record<string, unknown>) },
    children,
  );
}

export function CardTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["card-title", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

export function CardDesc({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["card-desc", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}
