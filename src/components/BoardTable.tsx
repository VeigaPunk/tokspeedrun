import { useNavigate } from "react-router";
import {
  formatDate,
  formatMs,
  formatTokens,
  formatUsd,
  totalTokens,
  txRate,
} from "@/lib/format";

export type BoardRun = {
  id: number;
  userId: number;
  trackId: number;
  runnerName: string | null;
  model: string;
  provider: string;
  harness: string | null;
  trackName: string;
  trackSlug: string;
  wallMs: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number | null;
  proofUrl: string | null;
  notes: string | null;
  status: "pending" | "verified" | "rejected";
  createdAt: Date;
};

export function StatusMark({ status }: { status: BoardRun["status"] }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
        <span className="inline-block h-1.5 w-1.5 bg-primary" />
        verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      <span className="inline-block h-1.5 w-1.5 border border-muted-foreground" />
      unverified
    </span>
  );
}

/**
 * The board is the centerpiece: a near-full-bleed spreadsheet with a
 * 1px grid. No cards, no nesting — rows and rules.
 */
export function BoardTable({
  runs,
  showTrack = true,
  rankOffset = 0,
}: {
  runs: BoardRun[];
  showTrack?: boolean;
  rankOffset?: number;
}) {
  const navigate = useNavigate();

  if (runs.length === 0) {
    return (
      <div className="border border-border px-6 py-16 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          NO TIMES SET — THE CLOCK IS WAITING.
        </p>
        <button
          onClick={() => navigate("/submit")}
          className="ghost-link mt-4 inline-block font-mono text-xs uppercase tracking-widest"
        >
          publish the first run
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="board-grid w-full min-w-[920px] text-left">
        <thead>
          <tr className="bg-[#111112] font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <th className="px-3 py-2.5 font-medium">Rk</th>
            <th className="px-3 py-2.5 font-medium">Runner</th>
            <th className="px-3 py-2.5 font-medium">Model</th>
            {showTrack && <th className="px-3 py-2.5 font-medium">Track</th>}
            <th className="px-3 py-2.5 text-right font-medium">Time</th>
            <th className="px-3 py-2.5 text-right font-medium">Tokens</th>
            <th className="px-3 py-2.5 text-right font-medium">Tok/$</th>
            <th className="px-3 py-2.5 text-right font-medium">Cost</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Date</th>
            <th className="px-3 py-2.5 font-medium">Proof</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {runs.map((r, i) => {
            const rate = txRate(r);
            return (
              <tr
                key={r.id}
                onClick={() => navigate(`/runs/${r.id}`)}
                className="cursor-pointer transition-colors hover:bg-secondary/60"
              >
                <td className="tnum px-3 py-2 text-muted-foreground">
                  {String(rankOffset + i + 1).padStart(2, "0")}
                </td>
                <td className="max-w-[140px] truncate px-3 py-2 font-sans text-sm font-medium">
                  {r.runnerName ?? "runner"}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2">
                  {r.model}
                  <span className="text-muted-foreground"> · {r.provider}</span>
                </td>
                {showTrack && (
                  <td className="max-w-[140px] truncate px-3 py-2 text-muted-foreground">
                    {r.trackName}
                  </td>
                )}
                <td className="tnum px-3 py-2 text-right text-sm font-semibold text-primary">
                  {formatMs(r.wallMs)}
                </td>
                <td
                  className="tnum px-3 py-2 text-right"
                  title={`${r.tokensIn.toLocaleString()} in / ${r.tokensOut.toLocaleString()} out`}
                >
                  {formatTokens(totalTokens(r))}
                </td>
                <td className="tnum px-3 py-2 text-right">
                  {rate != null ? rate.toLocaleString() : "—"}
                </td>
                <td className="tnum px-3 py-2 text-right text-muted-foreground">
                  {formatUsd(r.costUsd)}
                </td>
                <td className="px-3 py-2">
                  <StatusMark status={r.status} />
                </td>
                <td className="tnum px-3 py-2 text-muted-foreground">
                  {formatDate(r.createdAt)}
                </td>
                <td className="px-3 py-2">
                  {r.proofUrl ? (
                    <a
                      href={r.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ghost-link uppercase tracking-widest"
                    >
                      proof
                    </a>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
