"use client";

import { type ButtonHTMLAttributes } from "react";

export function PillButton({ className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} className={["pill-button", className].filter(Boolean).join(" ")} />;
}

