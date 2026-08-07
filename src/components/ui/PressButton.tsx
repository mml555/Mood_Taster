"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type PressButtonVariant = "primary" | "secondary" | "icon";

export type PressButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PressButtonVariant;
  fullWidth?: boolean;
  children?: ReactNode;
};

/**
 * Pressable control matching the AI Studio prototype: thick bottom edge,
 * compress on active. Prefer this for product CTAs over bare buttons.
 */
export function PressButton({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  type = "button",
  ...props
}: PressButtonProps) {
  const classes = [
    "press-btn",
    `press-btn-${variant}`,
    fullWidth ? "press-btn-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
