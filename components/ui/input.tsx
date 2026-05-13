import * as React from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "default" | "lg";
};

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { size = "default", className, ...rest },
  ref,
) {
  const classes = ["input", size === "lg" && "input--lg", className]
    .filter(Boolean)
    .join(" ");
  return <input ref={ref} className={classes} {...rest} />;
});
