"use client";

import * as React from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { Tabs } from "@/components/ui/tabs";

export interface CodeSample {
  id: string;
  label: string;
  filename: string;
  code: string;
}

/**
 * The one interactive leaf on the generated docs page: a language strip over a
 * `CodeBlock`. Every sample is built on the server from the tensor schema, so
 * this component only picks which one is visible.
 */
export function CodeSamples({
  samples,
  className,
}: {
  samples: CodeSample[];
  className?: string;
}) {
  const [active, setActive] = React.useState(samples[0]?.id ?? "");
  const current = samples.find((s) => s.id === active) ?? samples[0];

  if (!current) return null;

  return (
    <div className={className}>
      <Tabs
        tabs={samples.map((s) => ({ id: s.id, label: s.label }))}
        active={current.id}
        onChange={setActive}
        className="overflow-x-auto"
      />
      <CodeBlock
        code={current.code}
        filename={current.filename}
        className="mt-4"
      />
    </div>
  );
}
