/** Timing + token formatting. All figures render with tabular numerals. */

export function formatMs(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalS = Math.floor(totalCs / 100);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return m > 0 ? `${m}:${pad(s)}.${pad(cs)}` : `${s}.${pad(cs)}s`;
}

/** "mm:ss.cc" for the header stopwatch. */
export function formatClock(ms: number): string {
  const totalCs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s)}.${pad(totalCs)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}k`;
  return String(n);
}

export function formatUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function totalTokens(run: { tokensIn: number; tokensOut: number }) {
  return run.tokensIn + run.tokensOut;
}

/** Tokens per dollar — the tx-rate efficiency figure. Null without cost. */
export function txRate(run: {
  tokensIn: number;
  tokensOut: number;
  costUsd: number | null;
}): number | null {
  if (!run.costUsd || run.costUsd <= 0) return null;
  return Math.round(totalTokens(run) / run.costUsd);
}

/** Output tokens per second — generation pace. */
export function tokPerSec(run: { tokensOut: number; wallMs: number }): number {
  if (run.wallMs <= 0) return 0;
  return run.tokensOut / (run.wallMs / 1000);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
