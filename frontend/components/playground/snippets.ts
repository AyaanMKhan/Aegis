/**
 * Client snippets for a deployment's `/predict` endpoint.
 *
 * The body is passed straight through, so a snippet always reflects whatever is
 * currently in the playground editor. Keys are never interpolated literally:
 * Aegis hashes keys at rest and shows the full value exactly once, so the UI
 * only ever knows the prefix — every snippet reads the key from the environment
 * and names the selected key in a comment.
 */

export type SnippetLanguage = "curl" | "python" | "javascript" | "go";

export const SNIPPET_LANGUAGES: {
  id: SnippetLanguage;
  label: string;
  filename: string;
}[] = [
  { id: "curl", label: "cURL", filename: "predict.sh" },
  { id: "python", label: "Python", filename: "predict.py" },
  { id: "javascript", label: "JavaScript", filename: "predict.ts" },
  { id: "go", label: "Go", filename: "predict.go" },
];

export interface SnippetInput {
  /** Full POST URL, e.g. https://aegis.sh/d/resnet50-prod/predict */
  url: string;
  /** Pretty-printed JSON request body. */
  body: string;
  /** Name of the selected API key, e.g. "Production server". */
  keyName: string;
  /** Visible prefix of the selected key, e.g. "aeg_live_7Kq2". */
  keyPrefix: string;
  /** First output tensor name, used to destructure the result. */
  outputName: string;
}

/** Indents every line but the first — for embedding a body inside a call. */
function indentBody(body: string, pad: string): string {
  return body
    .split("\n")
    .map((line, i) => (i === 0 ? line : `${pad}${line}`))
    .join("\n");
}

function isIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function keyComment(input: SnippetInput, marker: string): string {
  return (
    `${marker} Key: ${input.keyName} (${input.keyPrefix}…). The full value is shown once at\n` +
    `${marker} creation and hashed at rest, so export it before running this.`
  );
}

function curl(input: SnippetInput): string {
  return [
    keyComment(input, "#"),
    `curl -sS -X POST ${input.url} \\`,
    `  -H "Authorization: Bearer $AEGIS_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${indentBody(input.body, "  ")}'`,
  ].join("\n");
}

function python(input: SnippetInput): string {
  return [
    "import os",
    "",
    "import requests",
    "",
    keyComment(input, "#"),
    "resp = requests.post(",
    `    "${input.url}",`,
    "    headers={",
    '        "Authorization": f"Bearer {os.environ[\'AEGIS_API_KEY\']}",',
    '        "Content-Type": "application/json",',
    "    },",
    `    json=${indentBody(input.body, "    ")},`,
    "    timeout=30,",
    ")",
    "resp.raise_for_status()",
    `print(resp.json()["${input.outputName}"])`,
  ].join("\n");
}

function javascript(input: SnippetInput): string {
  const destructure = isIdentifier(input.outputName)
    ? `const { ${input.outputName} } = await res.json();`
    : "const outputs = await res.json();";

  return [
    keyComment(input, "//"),
    `const res = await fetch("${input.url}", {`,
    '  method: "POST",',
    "  headers: {",
    "    Authorization: `Bearer ${process.env.AEGIS_API_KEY}`,",
    '    "Content-Type": "application/json",',
    "  },",
    `  body: JSON.stringify(${indentBody(input.body, "  ")}),`,
    "});",
    "",
    "if (!res.ok) {",
    "  throw new Error(`aegis ${res.status}: ${await res.text()}`);",
    "}",
    destructure,
  ].join("\n");
}

function go(input: SnippetInput): string {
  return [
    "package main",
    "",
    "import (",
    '\t"bytes"',
    '\t"fmt"',
    '\t"io"',
    '\t"net/http"',
    '\t"os"',
    ")",
    "",
    keyComment(input, "//"),
    "func main() {",
    `\tbody := []byte(\`${indentBody(input.body, "\t")}\`)`,
    "",
    `\treq, _ := http.NewRequest("POST", "${input.url}", bytes.NewReader(body))`,
    '\treq.Header.Set("Authorization", "Bearer "+os.Getenv("AEGIS_API_KEY"))',
    '\treq.Header.Set("Content-Type", "application/json")',
    "",
    "\tresp, err := http.DefaultClient.Do(req)",
    "\tif err != nil {",
    "\t\tpanic(err)",
    "\t}",
    "\tdefer resp.Body.Close()",
    "",
    "\tout, _ := io.ReadAll(resp.Body)",
    "\tfmt.Println(resp.StatusCode, string(out))",
    "}",
  ].join("\n");
}

const builders: Record<SnippetLanguage, (input: SnippetInput) => string> = {
  curl,
  python,
  javascript,
  go,
};

export function buildSnippet(
  language: SnippetLanguage,
  input: SnippetInput,
): string {
  return builders[language](input);
}
