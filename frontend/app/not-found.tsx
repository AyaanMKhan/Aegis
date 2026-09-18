import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base px-5 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-bg fade-edges"
      />

      <div className="relative">
        <Link href="/" className="inline-flex rounded-control" aria-label="Aegis home">
          <Wordmark />
        </Link>

        <p className="mt-10 font-mono text-6xl font-semibold tracking-tight text-fg tnum sm:text-7xl">
          404
        </p>

        <h1 className="mt-6 text-balance text-lg font-medium tracking-tight text-fg">
          This route was never provisioned.
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-fg-muted">
          The page you asked for isn&apos;t here. It may have been renamed, or
          the deployment behind it was destroyed.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
