import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium " +
  "transition-[background-color,border-color,color,opacity] duration-150 " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "[&_svg]:shrink-0 [&_svg]:size-4";

const variants: Record<Variant, string> = {
  // The light-on-dark emphasis: a near-white surface with black type.
  primary: "bg-fg text-base hover:bg-white active:bg-fg-muted",
  secondary:
    "bg-surface-2 text-fg border border-line-strong hover:bg-surface-3 hover:border-line-hover",
  outline: "border border-line-strong text-fg hover:bg-surface-2",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-failed/10 text-failed border border-failed/25 hover:bg-failed/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-[15px]",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(base, variants[variant], sizes[size]);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(buttonClasses(variant, size), className)} {...props} />;
}
