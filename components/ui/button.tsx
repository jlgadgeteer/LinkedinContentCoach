import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "default" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  /** When true, replaces the label with a pulsing dot + the streaming label. */
  streaming?: boolean;
  streamingLabel?: string;
};

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "secondary",
    size = "default",
    block,
    streaming,
    streamingLabel,
    className,
    disabled,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const classes = cn(
    "btn",
    variant === "primary" && "btn--primary",
    variant === "secondary" && "btn--secondary",
    variant === "ghost" && "btn--ghost",
    size === "sm" && "btn--sm",
    size === "lg" && "btn--lg",
    block && "btn--block",
    className,
  );

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || streaming}
      aria-busy={streaming || undefined}
      {...rest}
    >
      {streaming ? (
        <>
          <span className="dot-pulse" aria-hidden="true" />
          {streamingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
});
