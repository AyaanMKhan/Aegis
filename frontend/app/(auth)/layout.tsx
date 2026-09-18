import Link from "next/link";
import { Wordmark } from "@/components/ui/logo";

const legal: { href: string; label: string }[] = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/", label: "aegis.sh" },
];

/** Shared shell for login, signup and the OAuth callback. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-base">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-bg fade-edges" />
        <div className="absolute left-1/2 top-[-20rem] size-[36rem] -translate-x-1/2 rounded-full bg-accent/[0.05] blur-[150px]" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-16">
        <Link href="/" className="rounded-control" aria-label="Aegis home">
          <Wordmark />
        </Link>
        <main className="mt-8 w-full">{children}</main>
      </div>

      <footer className="relative flex items-center justify-center gap-3 px-5 pb-8 font-mono text-[11px] text-fg-subtle">
        {legal.map((item, i) => (
          <span key={item.label} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden>·</span>}
            <Link href={item.href} className="transition-colors hover:text-fg-muted">
              {item.label}
            </Link>
          </span>
        ))}
      </footer>
    </div>
  );
}
