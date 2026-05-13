import * as React from "react";

type Props = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, right, className }: Props) {
  return (
    <header className={["page-head", className].filter(Boolean).join(" ")}>
      <div className="page-head__left">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="page-header">{title}</h1>
      </div>
      {right ? <div className="page-head__right">{right}</div> : null}
    </header>
  );
}

export function SectionHeader({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}
    >
      <h2 className="section-header">{children}</h2>
      {right}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={["eyebrow", className].filter(Boolean).join(" ")}>{children}</span>;
}
