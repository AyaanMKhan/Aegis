import { cn } from "@/lib/utils";

/** Eyebrow + title + optional lead paragraph, shared by every landing section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
    </div>
  );
}
