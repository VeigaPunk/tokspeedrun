import { Link, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusMark } from "@/components/BoardTable";
import { useAuth } from "@/hooks/useAuth";
import {
  formatDate,
  formatMs,
  formatUsd,
  tokPerSec,
  totalTokens,
  txRate,
} from "@/lib/format";

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-border px-5 py-4">
      <div className="tnum font-mono text-xl font-semibold">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      {hint && (
        <div className="tnum mt-1 font-mono text-[10px] text-muted-foreground/70">
          {hint}
        </div>
      )}
    </div>
  );
}

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const runId = Number(id);
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: run, isLoading, error } = trpc.run.byId.useQuery(
    { id: runId },
    { enabled: Number.isFinite(runId) },
  );

  const moderate = trpc.run.moderate.useMutation({
    onSuccess: () => {
      utils.run.byId.invalidate({ id: runId });
      utils.run.board.invalidate();
    },
  });
  const removeRun = trpc.run.remove.useMutation({
    onSuccess: () => {
      window.location.href = "/board";
    },
  });

  if (isLoading) {
    return (
      <div className="noise min-h-screen">
        <SiteHeader />
        <div className="px-[2vw] py-24 font-mono text-xs text-muted-foreground">
          TIMING…
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="noise min-h-screen">
        <SiteHeader />
        <div className="px-[2vw] py-24">
          <p className="font-mono text-sm text-muted-foreground">
            RUN NOT FOUND — REJECTED OR NEVER EXISTED.
          </p>
          <Link
            to="/board"
            className="ghost-link mt-4 inline-block font-mono text-xs uppercase tracking-widest"
          >
            back to the board
          </Link>
        </div>
      </div>
    );
  }

  const rate = txRate(run);
  const pace = tokPerSec(run);
  const canModerate = user?.role === "admin";
  const canDelete = canModerate || user?.id === run.userId;

  return (
    <div className="noise min-h-screen">
      <SiteHeader />

      <main className="px-[2vw] py-14">
        <div className="mb-3 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Link to={`/board?track=${run.trackId}`} className="ghost-link">
            {run.trackName}
          </Link>
          <span>/</span>
          <span>run #{run.id}</span>
          <StatusMark status={run.status} />
        </div>

        <h1 className="tnum font-mono text-[16vw] font-bold leading-none tracking-tighter text-primary md:text-[10vw]">
          {formatMs(run.wallMs)}
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          <span className="font-semibold text-foreground">
            {run.runnerName ?? "runner"}
          </span>{" "}
          · {run.model} · {run.provider}
          {run.harness ? ` · ${run.harness}` : ""} ·{" "}
          {formatDate(run.createdAt)}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-px md:grid-cols-4">
          <Metric
            label="tokens in"
            value={run.tokensIn.toLocaleString()}
          />
          <Metric
            label="tokens out"
            value={run.tokensOut.toLocaleString()}
            hint={`${pace.toFixed(1)} tok/s pace`}
          />
          <Metric
            label="total tokens"
            value={totalTokens(run).toLocaleString()}
          />
          <Metric
            label="cost"
            value={formatUsd(run.costUsd)}
            hint={rate != null ? `${rate.toLocaleString()} tok/$` : "no cost reported"}
          />
        </div>

        {run.notes && (
          <section className="mt-10 max-w-3xl">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              runner notes
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {run.notes}
            </p>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-5 font-mono text-xs uppercase tracking-[0.2em]">
          {run.proofUrl && (
            <a
              href={run.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="border border-primary px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              inspect the proof
            </a>
          )}
          {canModerate && (
            <>
              {run.status !== "verified" && (
                <button
                  onClick={() => moderate.mutate({ id: run.id, status: "verified" })}
                  className="border border-border px-4 py-2 text-foreground hover:border-primary hover:text-primary"
                >
                  verify
                </button>
              )}
              {run.status !== "rejected" && (
                <button
                  onClick={() => moderate.mutate({ id: run.id, status: "rejected" })}
                  className="border border-border px-4 py-2 text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  reject
                </button>
              )}
            </>
          )}
          {canDelete && (
            <button
              onClick={() => {
                if (window.confirm("Delete this run permanently?")) {
                  removeRun.mutate({ id: run.id });
                }
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              delete
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
