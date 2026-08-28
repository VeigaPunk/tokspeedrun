import { trpc } from "@/providers/trpc";
import { formatMs, formatTokens, totalTokens } from "@/lib/format";

/**
 * Latest-runs marquee — a linear, constant-speed results ticker.
 * Content is duplicated once so translateX(-50%) loops seamlessly.
 */
export function RunTicker() {
  const { data: runs } = trpc.run.recent.useQuery({ limit: 12 });

  const items =
    runs && runs.length > 0
      ? runs.map(
          (r) =>
            `${(r.runnerName ?? "runner").toUpperCase()} · ${r.model.toUpperCase()} · ${formatMs(r.wallMs)} · ${formatTokens(totalTokens(r))} TOK · ${r.trackName.toUpperCase()}`,
        )
      : [
          "NO RUNS ON THE BOARD YET",
          "SET THE FIRST TIME",
          "FIXED TASKS · LIVE CLOCK · TOKEN METER",
        ];

  const strip = items.join("  +++  ");

  return (
    <div className="overflow-hidden border-y border-border bg-[#111112] py-2">
      <div className="flex w-max animate-marquee whitespace-nowrap font-mono text-xs tracking-wider text-muted-foreground">
        <span className="pr-16">{strip}&nbsp;&nbsp;+++&nbsp;&nbsp;</span>
        <span className="pr-16" aria-hidden>
          {strip}&nbsp;&nbsp;+++&nbsp;&nbsp;
        </span>
      </div>
    </div>
  );
}
