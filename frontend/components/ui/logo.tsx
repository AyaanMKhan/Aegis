import * as React from "react";
import { cn } from "@/lib/utils";

/** The shield mark. Lime stroke on dark is the one place the accent is a shape. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6", className)}
      aria-hidden
    >
      <path
        d="M12 2.5 4.5 5.8v6.1c0 4.6 3.1 8.4 7.5 9.6 4.4-1.2 7.5-5 7.5-9.6V5.8L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m8.6 11.9 2.4 2.5 4.4-4.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo className="size-5 text-accent" />
      <span className="text-[15px] font-semibold tracking-tight text-fg">
        Aegis
      </span>
    </span>
  );
}
