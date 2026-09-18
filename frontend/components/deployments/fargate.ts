/**
 * Fargate task-size matrix.
 *
 * ECS refuses a RegisterTaskDefinition whose memory is not one of the values
 * legal for the chosen CPU, so the config form has to constrain the pair rather
 * than offer two free-running selects.
 * Ref: the task CPU/memory combinations in the ECS developer guide.
 */

export const FARGATE_CPU_UNITS = [256, 512, 1024, 2048, 4096] as const;

function range(from: number, to: number, step = 1024): number[] {
  const out: number[] = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
}

/** Legal task memory (MiB) for each CPU unit value. */
export const FARGATE_MEMORY_BY_CPU: Record<number, number[]> = {
  256: [512, 1024, 2048],
  512: range(1024, 4096),
  1024: range(2048, 8192),
  2048: range(4096, 16384),
  4096: range(8192, 30720),
};

export function memoryOptionsFor(cpu: number): number[] {
  return FARGATE_MEMORY_BY_CPU[cpu] ?? FARGATE_MEMORY_BY_CPU[1024];
}

/** Closest legal memory for a CPU value — used when the CPU select changes. */
export function nearestLegalMemory(cpu: number, memory: number): number {
  const options = memoryOptionsFor(cpu);
  return options.reduce(
    (best, v) => (Math.abs(v - memory) < Math.abs(best - memory) ? v : best),
    options[0],
  );
}

/** "0.5 vCPU · 1–4 GB" — the hint under the CPU select. */
export function memoryRangeLabel(cpu: number): string {
  const options = memoryOptionsFor(cpu);
  const lo = options[0];
  const hi = options[options.length - 1];
  const gb = (mib: number) => (mib < 1024 ? `${mib} MiB` : `${mib / 1024} GB`);
  return `${gb(lo)}–${gb(hi)}`;
}
