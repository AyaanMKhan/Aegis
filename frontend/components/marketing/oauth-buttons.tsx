import { ButtonLink, buttonClasses } from "@/components/ui/button";

/**
 * Brand glyphs, hand-written: lucide ships no trademarked marks.
 *
 * Google is wired to the control plane: a plain <a>, not next/link, because
 * starting an OAuth handshake has to be a real cross-origin navigation rather
 * than a client-side route change. GitHub still points at the mock callback
 * until its provider is registered backend-side.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function GitHubGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.76 12.276c0-.902-.08-1.768-.23-2.6H12.24v4.92h6.482a5.54 5.54 0 0 1-2.402 3.632v3.017h3.888c2.276-2.096 3.552-5.184 3.552-8.969Z"
      />
      <path
        fill="#34A853"
        d="M12.24 24c3.24 0 5.956-1.076 7.941-2.91l-3.888-3.018c-1.076.72-2.452 1.146-4.053 1.146-3.115 0-5.753-2.103-6.694-4.93H1.544v3.115C3.516 21.232 7.566 24 12.24 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.546 14.288a7.2 7.2 0 0 1-.376-2.288c0-.794.137-1.566.376-2.288V6.596H1.544A11.99 11.99 0 0 0 0 12c0 1.936.464 3.769 1.544 5.404l4.002-3.116Z"
      />
      <path
        fill="#EA4335"
        d="M12.24 4.75c1.757 0 3.333.604 4.573 1.79l3.43-3.43C18.19 1.188 15.474 0 12.24 0 7.566 0 3.516 2.768 1.544 6.596l4.002 3.116c.941-2.828 3.579-4.962 6.694-4.962Z"
      />
    </svg>
  );
}

export function OAuthButtons({ verb = "Continue" }: { verb?: string }) {
  return (
    <div className="grid gap-2.5">
      <ButtonLink
        href="/callback?provider=github"
        variant="secondary"
        size="lg"
        className="w-full"
      >
        <GitHubGlyph />
        {verb} with GitHub
      </ButtonLink>
      <a
        href={`${API_URL}/auth/google/login`}
        className={`${buttonClasses("secondary", "lg")} w-full`}
      >
        <GoogleGlyph />
        {verb} with Google
      </a>
    </div>
  );
}
