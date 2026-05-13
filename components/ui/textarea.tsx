import * as React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: "prose" | "mono";
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { variant = "prose", className, ...rest },
  ref,
) {
  const classes = ["textarea", variant === "mono" && "textarea--mono", className]
    .filter(Boolean)
    .join(" ");
  return <textarea ref={ref} className={classes} {...rest} />;
});
