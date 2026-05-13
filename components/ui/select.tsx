import * as React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, Props>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={["select", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </select>
  );
});
