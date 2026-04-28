import { type ReactNode } from "react";

export function Surface({
  children,
  variant = "surface",
  className = "",
}: {
  children: ReactNode;
  variant?: "surface" | "surface-soft" | "glass-panel" | "feed-card" | "composer-card" | "sidebar-card";
  className?: string;
}) {
  return <div className={[variant, className].filter(Boolean).join(" ")}>{children}</div>;
}

