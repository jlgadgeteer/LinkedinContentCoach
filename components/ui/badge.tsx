import * as React from "react";

type Variant = "neutral" | "success" | "danger" | "accent";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

export function Badge({ variant = "neutral", className, children, ...rest }: Props) {
  const classes = [
    "badge",
    variant === "success" && "badge--success",
    variant === "danger" && "badge--danger",
    variant === "accent" && "badge--accent",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
