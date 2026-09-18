import Link from "next/link";
import { Wordmark } from "@/components/ui/logo";

const columns: { heading: string; links: { href: string; label: string }[] }[] =
  [
    {
      heading: "Product",
      links: [
        { href: "#product", label: "Overview" },
        { href: "#how-it-works", label: "How it works" },
        { href: "#specs", label: "Runtime specs" },
      ],
    },
    {
      heading: "Platform",
      links: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/projects", label: "Projects" },
        {
          href: "/dashboard/deployments/dep_resnet_prod/docs",
          label: "API reference",
        },
      ],
    },
    {
      heading: "Account",
      links: [
        { href: "/login", label: "Log in" },
        { href: "/signup", label: "Create an account" },
        { href: "/dashboard/api-keys", label: "API keys" },
      ],
    },
  ];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-base">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-fg-muted">
              An ONNX model file in, an HTTPS inference endpoint out — on ECS
              Fargate, provisioned by Terraform you can read.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                {column.heading}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-fg-subtle">
            © 2026 Aegis · built for learning Terraform and AWS in public
          </p>
          <p className="flex items-center gap-2 font-mono text-[11px] text-fg-subtle">
            <span className="size-1.5 rounded-full bg-live animate-pulse-dot" />
            us-east-1 · all services operational
          </p>
        </div>
      </div>
    </footer>
  );
}
