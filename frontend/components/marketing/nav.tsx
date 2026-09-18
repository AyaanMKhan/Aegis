import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/logo";

const DOCS_HREF = "/dashboard/deployments/dep_resnet_prod/docs";

const links: { href: string; label: string }[] = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: DOCS_HREF, label: "Docs" },
];

/** Sticky marketing header: wordmark, anchor links, ghost log-in, light CTA. */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-base/80 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link href="/" className="rounded-control" aria-label="Aegis home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-control px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ButtonLink
            href="/login"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" variant="primary" size="sm">
            Get started
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}
