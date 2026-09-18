import type { TensorSpec } from "@/types/api";

/**
 * Builds the ready-to-paste curl shown on the deployment overview.
 *
 * The body is generated from the deployed ModelVersion's real `inputSchema`, so
 * the tensor names, dtypes and shapes match what the runner will accept. Dynamic
 * axes (null) become 1 — a single-item batch.
 */

function concreteShape(shape: (number | null)[]): number[] {
  return shape.map((d) => d ?? 1);
}

function elementCount(shape: number[]): number {
  return shape.reduce((a, b) => a * b, 1);
}

function sampleValue(dtype: string): string {
  if (dtype.startsWith("int") || dtype.startsWith("uint")) return "0";
  if (dtype === "bool") return "false";
  return "0.0";
}

function dataLiteral(t: TensorSpec): string {
  const shape = concreteShape(t.shape);
  const n = elementCount(shape);
  if (n <= 12) {
    return `[${Array.from({ length: n }, () => sampleValue(t.dtype)).join(", ")}]`;
  }
  // Too many to inline; name the exact count the runner expects instead.
  return `"<${n.toLocaleString("en-US")} ${t.dtype} values, row-major>"`;
}

/** The JSON body, hand-formatted so shapes stay on one line. */
export function sampleRequestBody(inputs: TensorSpec[], indent = "  "): string {
  if (inputs.length === 0) {
    return `${indent}{ "inputs": {} }`;
  }
  const tensors = inputs
    .map((t) => {
      const shape = `[${concreteShape(t.shape).join(", ")}]`;
      return [
        `${indent}    "${t.name}": {`,
        `${indent}      "dtype": "${t.dtype}",`,
        `${indent}      "shape": ${shape},`,
        `${indent}      "data": ${dataLiteral(t)}`,
        `${indent}    }`,
      ].join("\n");
    })
    .join(",\n");

  return [`${indent}{`, `${indent}  "inputs": {`, tensors, `${indent}  }`, `${indent}}`].join(
    "\n",
  );
}

export function buildCurl({
  endpointUrl,
  keyPrefix,
  inputs,
}: {
  endpointUrl: string;
  keyPrefix: string;
  inputs: TensorSpec[];
}): string {
  return [
    `curl -X POST ${endpointUrl}/predict \\`,
    `  -H "Authorization: Bearer ${keyPrefix}..." \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${sampleRequestBody(inputs).trimStart()}'`,
  ].join("\n");
}
