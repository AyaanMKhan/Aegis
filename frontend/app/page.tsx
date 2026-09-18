import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  FileJson2,
  KeyRound,
  Layers,
  ScanSearch,
  ScrollText,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";

const DOCS_HREF = "/dashboard/deployments/dep_resnet_prod/docs";

export const metadata: Metadata = {
  title: { absolute: "Aegis — Deploy ONNX models as HTTPS APIs" },
  description:
    "Upload an .onnx file and get a versioned HTTPS inference endpoint behind an API key — one ECS Fargate service per deployment, provisioned by a real terraform apply.",
};

/* ------------------------------------------------------------------ copy */

const deployTranscript = `14:18:02  uploaded   resnet50-v3.onnx  97.3 MB
                     s3://aegis-models/prj_vision/mdl_resnet/v3.onnx
14:18:04  inspected  opset 17 - producer pytorch
                     input   float32[?, 3, 224, 224]
                     logits  float32[?, 1000]
14:18:07  planning   terraform init - backend s3, dynamodb lock
                     deployments/dep_resnet_prod/terraform.tfstate
14:18:19  planning   Plan: 6 to add, 0 to change, 0 to destroy.
14:18:23  applying   aws_ecs_task_definition.runner: complete after 2s
14:18:30  applying   aws_lb_target_group.this: complete after 3s
14:18:38  applying   aws_ecs_service.this: 3/3 tasks healthy
14:18:45  live       https://aegis.sh/d/resnet50-prod        43.2s`;

const curlTranscript = `$ curl -X POST https://aegis.sh/d/resnet50-prod/predict \\
    -H "Authorization: Bearer aeg_live_7Kq2p...Vn9" \\
    -H "Content-Type: application/json" \\
    -d '{"input": [[[0.485, 0.456, 0.406, ...]]]}'

{
  "deployment": "resnet50-prod",
  "model_version": 3,
  "outputs": {
    "logits": [[-2.417, 0.983, 7.512, 1.204, -0.665, ...]]
  },
  "shape": [1, 1000],
  "latency_ms": 24.7
}`;

const steps: {
  n: string;
  title: string;
  body: string;
  meta: string;
}[] = [
  {
    n: "01",
    title: "Upload the .onnx",
    body: "The browser uploads straight to S3 through a presigned URL, so the control plane never proxies a hundred megabytes. Each upload lands as a new model version, never an overwrite.",
    meta: "resnet50-v3.onnx · 97.3 MB",
  },
  {
    n: "02",
    title: "Aegis inspects the graph",
    body: "The backend parses the model with onnx: producer name, opset version, checksum, and every input and output tensor with its name, shape and dtype. That signature becomes the deployment's contract.",
    meta: "opset 17 · float32[?,3,224,224]",
  },
  {
    n: "03",
    title: "terraform apply provisions it",
    body: "The API renders tfvars and applies the deployment module — task definition, ECS Fargate service, target group, and an ALB listener rule. Its own state key in S3, its own DynamoDB lock.",
    meta: "deployments/dep_resnet_prod/terraform.tfstate",
  },
  {
    n: "04",
    title: "Call your endpoint",
    body: "The shared ALB routes your path to the new target group over HTTPS. Send tensors with an API key, then watch requests, latency and CloudWatch logs land in the dashboard.",
    meta: "POST /d/resnet50-prod/predict",
  },
];

const features: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}[] = [
  {
    icon: Layers,
    title: "Terraform state per deployment",
    body: "Every deployment is a real apply of the same module under its own state key with DynamoDB locking, so one failed plan can never touch another service.",
  },
  {
    icon: ScanSearch,
    title: "Schema read from the graph",
    body: "Input and output tensors, shapes, dtypes, opset and producer are extracted from the ONNX file itself — not typed into a form and not guessed at call time.",
  },
  {
    icon: FileJson2,
    title: "Generated OpenAPI docs",
    body: "The stored tensor schema becomes a per-deployment OpenAPI document with a copyable curl example, so nobody has to reverse-engineer the payload shape.",
  },
  {
    icon: ScrollText,
    title: "CloudWatch log tailing",
    body: "Runner task stdout streams into the logs tab, already filtered to one deployment and one log stream. No console tab-hunting to see why a request 500'd.",
  },
  {
    icon: Activity,
    title: "Request and latency metrics",
    body: "The gateway records every authenticated call, so request volume, p50 and p95 latency and error rate are charted per deployment over the last 48 hours.",
  },
  {
    icon: KeyRound,
    title: "API keys hashed at rest",
    body: "Keys are shown exactly once and stored as a hash beside a visible prefix. Revoke one and the gateway rejects it on the next request.",
  },
];

const specs: { label: string; value: string }[] = [
  { label: "Runtime", value: "ECS Fargate" },
  { label: "Region", value: "us-east-1" },
  { label: "ONNX opset", value: "≤ 18" },
  { label: "Median deploy", value: "43s" },
  { label: "Transport", value: "HTTPS · ACM" },
];

/* ------------------------------------------------------------------ page */

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base">
      <MarketingNav />

      <main className="flex-1">
        {/* ---------------------------------------------------------- hero */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 grid-bg fade-edges" />
            <div className="absolute left-1/2 top-[-22rem] size-[44rem] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[160px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
            <div className="max-w-3xl">
              <Link
                href="#how-it-works"
                className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/70 py-1 pl-1 pr-3 text-[12px] text-fg-muted transition-colors hover:border-line-hover hover:text-fg"
              >
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-medium text-accent">
                  Phase 1
                </span>
                ONNX inspection is live
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-[3.5rem]">
                Upload an{" "}
                <span className="font-mono text-[0.86em] text-accent">
                  .onnx
                </span>{" "}
                file.
                <br />
                <span className="text-fg-muted">Get back an HTTPS API.</span>
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
                Aegis reads your model&apos;s graph, renders a Terraform module
                and runs a real apply: one ECS Fargate service per deployment
                behind a shared ALB. You get a versioned endpoint, generated
                docs, logs and latency metrics — secured by an API key, not a
                port you forgot to close.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/signup" size="lg">
                  Deploy a model
                  <ArrowRight />
                </ButtonLink>
                <ButtonLink href={DOCS_HREF} variant="secondary" size="lg">
                  Read the docs
                </ButtonLink>
              </div>

              <p className="mt-6 font-mono text-[11px] text-fg-subtle">
                No Dockerfile. No YAML. No cluster to babysit.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------- code proof */}
          <div className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
            <div className="grid gap-4 lg:grid-cols-2">
              <CodeBlock
                filename="dep_resnet_prod — deployment log"
                code={deployTranscript}
                className="animate-rise"
              />
              <CodeBlock
                filename="predict — 200 OK"
                code={curlTranscript}
                className="animate-rise"
              />
            </div>
            <p className="mt-4 font-mono text-[11px] text-fg-subtle">
              One deployment&apos;s event stream, ending in a real{" "}
              <span className="text-fg-muted">terraform apply</span> — and the
              bearer-authenticated POST that returns your model&apos;s own
              output tensors.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------- how it works */}
        <section
          id="how-it-works"
          className="border-t border-line bg-surface/30"
        >
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionHeading
              eyebrow="How it works"
              title="Four steps, and the third one is Terraform."
              description="Nothing here is a managed abstraction over your model. The infrastructure is ordinary AWS you could have written by hand — Aegis just writes it correctly, every time, per deployment."
            />

            <ol className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <li key={step.n} className="flex flex-col bg-surface p-6">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-accent">
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-[15px] font-medium tracking-tight text-fg">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-fg-muted">
                    {step.body}
                  </p>
                  <p className="mt-5 truncate border-t border-line pt-4 font-mono text-[11px] text-fg-subtle">
                    {step.meta}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------ features */}
        <section id="product" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionHeading
              eyebrow="Platform"
              title="Everything a deployed model needs, and nothing it doesn't."
              description="One ALB is shared by every deployment and routed by path, so idle cost stays flat at roughly $16/mo whether you run one model or thirty."
            />

            <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="bg-surface p-6">
                  <span className="inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface-2 text-accent raised">
                    <feature.icon className="size-4" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-medium tracking-tight text-fg">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-fg-muted">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- spec strip */}
        <section id="specs" className="border-y border-line bg-surface/30">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="py-6 pr-4 sm:px-6 sm:first:pl-0 lg:last:pr-0"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                    {spec.label}
                  </dt>
                  <dd className="mt-2 font-mono text-sm text-fg tnum">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ----------------------------------------------------- final CTA */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid-bg fade-edges"
          />
          <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 sm:py-28">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Your model is one apply away from a URL.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-fg-muted">
              Sign in with GitHub or Google, create a project, and put your first
              ONNX file behind an endpoint before your coffee goes cold.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Deploy a model
                <ArrowRight />
              </ButtonLink>
              <ButtonLink href={DOCS_HREF} variant="secondary" size="lg">
                Read the docs
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
