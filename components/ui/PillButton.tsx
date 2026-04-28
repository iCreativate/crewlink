"use client";

import { type ButtonHTMLAttributes } from "react";

export function PillButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={["pill-button", className].filter(Boolean).join(" ")} />;
}

