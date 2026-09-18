import type { Metadata } from "next";
import Link from "next/link";

import { OAuthButtons } from "@/components/marketing/oauth-buttons";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Sign in to Aegis with GitHub or Google to manage your projects, models and deployments.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-[380px] animate-rise">
      <Card className="px-6 py-7">
        <h1 className="text-lg font-semibold tracking-tight text-fg">
          Log in to Aegis
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
          Continue with the provider you signed up with. Either one lands on the
          same account.
        </p>

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-fg-subtle">
          By continuing you agree to the{" "}
          <Link
            href="/terms"
            className="text-fg-muted underline underline-offset-2 transition-colors hover:text-fg"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-fg-muted underline underline-offset-2 transition-colors hover:text-fg"
          >
            Privacy Policy
          </Link>
          . Aegis reads only your name, email and avatar.
        </p>
      </Card>

      <p className="mt-5 text-center text-[13px] text-fg-muted">
        New to Aegis?{" "}
        <Link
          href="/signup"
          className="font-medium text-fg transition-colors hover:text-accent"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
