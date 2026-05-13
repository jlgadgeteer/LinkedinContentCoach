import * as React from "react";

type Props = React.LabelHTMLAttributes<HTMLLabelElement> & {
  hint?: React.ReactNode;
};

export function Label({ hint, className, children, ...rest }: Props) {
  return (
    <label className={["label", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}
