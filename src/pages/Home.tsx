import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { SiteHeader } from "@/components/SiteHeader";
import { RunTicker } from "@/components/RunTicker";
import { BoardTable } from "@/components/BoardTable";
import { formatTokens } from "@/lib/format";

function StatStrip() {
  const { data: stats } = trpc.run.stats.useQuery();
  const cells = [
    { label: "runs logged", value: stats?.totalRuns ?? 0 },
    { label: "tracks open", value: stats?.totalTracks ?? 0 },
    { label: "models raced", value: stats?.distinctModels ?? 0 },
    {
      label: "tokens burned",
      value: stats ? formatTokens(stats.totalTokens) : "0",
    },
  ];
  return (
    <div className="grid grid-cols-2 border border-border md:grid-cols-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="border-border px-5 py-4 [&:not(:last-child)]:border-r max-md:[&:nth-child(-n+2)]:border-b"
        >
          <div className="tnum font-mono text-2xl font-semibold text-foreground">
            {c.value}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function TracksIndex() {
  const { data: tracks } = trpc.track.list.useQuery();
  const navigate = useNavigate();

  return (
    <section className="mt-20">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-3xl font-bold tracking-tighter">THE TRACKS</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          fixed tasks — same start line for everyone
        </span>
      </div>
      <div className="border-t border-border">
        {tracks?.map((t, i) => (
          <button
            key={t.id}
            onClick={() => navigate(`/board?track=${t.id}`)}
            className="group grid w-full grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-b border-border px-2 py-5 text-left transition-colors hover:bg-secondary/50"
          >
            <span className="tnum font-mono text-xs text-muted-foreground">
              T{String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight group-hover:text-primary">
                {t.name}
              </span>
              <span className="mt-1 line-clamp-2 block max-w-3xl text-sm text-muted-foreground">
                {t.task}
              </span>
            </span>
            <span className="tnum font-mono text-xs text-muted-foreground">
              {t.runCount} {t.runCount === 1 ? "run" : "runs"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function LatestBoard() {
  const { data: runs } = trpc.run.board.useQuery({ limit: 8 });

  return (
    <section className="mt-20">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-3xl font-bold tracking-tighter">LATEST TIMES</h2>
        <Link
          to="/board"
          className="ghost-link font-mono text-xs uppercase tracking-[0.2em]"
        >
          full board
        </Link>
      </div>
      {runs && <BoardTable runs={runs} />}
    </section>
  );
}

export default function Home() {
  return (
    <div className="noise min-h-screen">
      <SiteHeader />
      <RunTicker />

      <section className="px-[2vw] pb-24 pt-16 md:pt-24">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Token speedrunning leaderboard — clock and meter decide
        </p>
        <h1 className="text-balance text-[13vw] font-bold leading-[0.85] tracking-[-0.045em] md:text-[9.5vw]">
          RACE THE
          <br />
          <span className="text-primary">TOKEN.</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          One fixed task. One agent. The stopwatch and the token meter tell the
          truth. Publish your run with proof — the board decides if it stands.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/submit"
            className="bg-primary px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-accent"
          >
            Set a time
          </Link>
          <Link
            to="/board"
            className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Browse the board
          </Link>
        </div>

        <div className="mt-16">
          <StatStrip />
        </div>

        <LatestBoard />
        <TracksIndex />
      </section>

      <footer className="border-t border-border px-[2vw] py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className="font-mono text-xs text-muted-foreground">
            TOKSPEEDRUN — every run is a receipt.
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            sign in · publish · get verified
          </span>
        </div>
      </footer>
    </div>
  );
}
