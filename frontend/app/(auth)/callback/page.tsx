import type { Metadata } from "next";
import { Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Completing sign-in",
  description: "Finishing the OAuth handshake with the Aegis control plane.",
};

function providerLabel(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "github") return "GitHub";
  if (raw === "google") return "Google";
  return null;
}

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const provider = providerLabel(params.provider);

  return (
    <div className="mx-auto w-full max-w-[380px] animate-rise">
      <Card className="px-6 py-8 text-center">
        <span className="mx-auto inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface-2 raised">
          <Loader2 className="size-4 animate-spin text-accent" />
        </span>

        <h1 className="mt-5 text-[15px] font-medium tracking-tight text-fg">
          Completing sign-in…
        </h1>
        <p className="mx-auto mt-2 max-w-[19rem] text-[13px] leading-relaxed text-fg-muted">
          Exchanging the authorization code
          {provider ? ` from ${provider}` : ""} for a signed session cookie.
          You&apos;ll land on your dashboard in a moment.
        </p>

        <p className="mt-6 border-t border-line pt-4 font-mono text-[11px] text-fg-subtle">
          POST /auth/callback · aegis.sh
        </p>
      </Card>
    </div>
  );
}
