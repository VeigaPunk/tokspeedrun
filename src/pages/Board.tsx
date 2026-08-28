import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { SiteHeader } from "@/components/SiteHeader";
import { BoardTable, type BoardRun } from "@/components/BoardTable";
import { totalTokens } from "@/lib/format";
import type { BoardSort } from "@contracts/constants";

const SORTS: { id: BoardSort; label: string }[] = [
  { id: "time", label: "fastest" },
  { id: "tokens", label: "fewest tokens" },
  { id: "cost", label: "cheapest" },
  { id: "recent", label: "latest" },
];

function sortRuns(runs: BoardRun[], sort: BoardSort): BoardRun[] {
  const copy = [...runs];
  switch (sort) {
    case "time":
      return copy.sort((a, b) => a.wallMs - b.wallMs);
    case "tokens":
      return copy.sort((a, b) => totalTokens(a) - totalTokens(b));
    case "cost":
      return copy.sort(
        (a, b) => (a.costUsd ?? Infinity) - (b.costUsd ?? Infinity),
      );
    case "recent":
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export default function Board() {
  const [params, setParams] = useSearchParams();
  const trackParam = params.get("track");
  const trackId = trackParam ? Number(trackParam) : undefined;
  const [sort, setSort] = useState<BoardSort>("time");
  const [showPending, setShowPending] = useState(true);

  const { data: tracks } = trpc.track.list.useQuery();
  const { data: runs, isLoading } = trpc.run.board.useQuery({
    trackId,
    includePending: true,
    limit: 500,
  });

  const visible = useMemo(() => {
    const base = showPending
      ? runs ?? []
      : (runs ?? []).filter((r) => r.status === "verified");
    return sortRuns(base, sort);
  }, [runs, sort, showPending]);

  const activeTrack = tracks?.find((t) => t.id === trackId);

  return (
    <div className="noise min-h-screen">
      <SiteHeader />

      <main className="px-[1vw] py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 px-[1vw]">
          <div>
            <h1 className="text-5xl font-bold tracking-tighter md:text-6xl">
              {activeTrack ? activeTrack.name.toUpperCase() : "THE BOARD"}
            </h1>
            {activeTrack && (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                {activeTrack.task}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="text-muted-foreground">sort</span>
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={
                  sort === s.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-1 px-[1vw] font-mono text-[10px] uppercase tracking-[0.2em]">
          <button
            onClick={() => setParams({})}
            className={`border px-3 py-1.5 ${
              !trackId
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            all tracks
          </button>
          {tracks?.map((t) => (
            <button
              key={t.id}
              onClick={() => setParams({ track: String(t.id) })}
              className={`border px-3 py-1.5 ${
                trackId === t.id
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.name}
              <span className="ml-2 text-muted-foreground/70">{t.runCount}</span>
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={showPending}
              onChange={(e) => setShowPending(e.target.checked)}
              className="h-3 w-3 accent-[#d2ff00]"
            />
            show unverified
          </label>
        </div>

        {isLoading ? (
          <div className="border border-border px-6 py-16 text-center font-mono text-xs text-muted-foreground">
            TIMING…
          </div>
        ) : (
          <BoardTable runs={visible} showTrack={!trackId} />
        )}
      </main>
    </div>
  );
}
