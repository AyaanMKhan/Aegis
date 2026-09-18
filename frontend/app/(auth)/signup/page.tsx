import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { OAuthButtons } from "@/components/marketing/oauth-buttons";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create an Aegis account with GitHub or Google and put an ONNX model behind an HTTPS endpoint.",
};

const bullets: string[] = [
  "Request and response schema read straight from the ONNX graph.",
  "Terraform state per deployment, one shared ALB, flat idle cost.",
  "API keys hashed at rest and revocable from the dashboard.",
];

export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-[380px] animate-rise">
      <Card className="px-6 py-7">
        <h1 className="text-lg font-semibold tracking-tight text-fg">
          Create your Aegis account
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
          No password to forget. Bind GitHub and Google to the same account and
          sign in with whichever is open.
        </p>

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-fg-subtle">
          <Check className="mt-px size-3.5 shrink-0 text-accent" />
          <span>
            No credit card. Upload and ONNX graph inspection are live today;
            programmatic deploys land in phase 3, and you bring your own AWS
            account when they do.
          </span>
        </p>

        <p className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-fg-subtle">
          By creating an account you agree to the{" "}
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
          .
        </p>
      </Card>

      <ul className="mt-6 space-y-2.5">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-fg-muted"
          >
            <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
            {bullet}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-[13px] text-fg-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-fg transition-colors hover:text-accent"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
