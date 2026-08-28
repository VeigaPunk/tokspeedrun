import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusMark } from "@/components/BoardTable";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import { formatDate, formatMs, formatTokens, totalTokens } from "@/lib/format";

const fieldLabel =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground";
const fieldInput =
  "w-full border border-input bg-transparent px-3 py-2.5 font-mono text-sm outline-none focus:border-primary placeholder:text-muted-foreground/50";

function RunsQueue() {
  const utils = trpc.useUtils();
  const { data: runs, isLoading } = trpc.run.queue.useQuery();
  const invalidate = () => {
    utils.run.queue.invalidate();
    utils.run.board.invalidate();
    utils.run.stats.invalidate();
    utils.run.recent.invalidate();
  };
  const moderate = trpc.run.moderate.useMutation({
    onSuccess: (_r, v) => {
      toast.success(`Run #${v.id} → ${v.status}`);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const removeRun = trpc.run.remove.useMutation({
    onSuccess: () => {
      toast.success("Run deleted");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="py-16 text-center font-mono text-xs text-muted-foreground">
        LOADING QUEUE…
      </div>
    );

  if (!runs || runs.length === 0) {
    return (
      <div className="border border-border px-6 py-16 text-center font-mono text-sm text-muted-foreground">
        QUEUE EMPTY — NOTHING TO STEWARD.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="board-grid w-full min-w-[880px] text-left">
        <thead>
          <tr className="bg-[#111112] font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <th className="px-3 py-2.5 font-medium">Run</th>
            <th className="px-3 py-2.5 font-medium">Runner</th>
            <th className="px-3 py-2.5 font-medium">Model</th>
            <th className="px-3 py-2.5 font-medium">Track</th>
            <th className="px-3 py-2.5 text-right font-medium">Time</th>
            <th className="px-3 py-2.5 text-right font-medium">Tokens</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Proof</th>
            <th className="px-3 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {runs.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-secondary/60">
              <td className="tnum px-3 py-2">
                <Link to={`/runs/${r.id}`} className="ghost-link">
                  #{r.id}
                </Link>
              </td>
              <td className="max-w-[120px] truncate px-3 py-2 font-sans text-sm">
                {r.runnerName ?? "runner"}
              </td>
              <td className="max-w-[140px] truncate px-3 py-2">{r.model}</td>
              <td className="max-w-[120px] truncate px-3 py-2 text-muted-foreground">
                {r.trackName}
              </td>
              <td className="tnum px-3 py-2 text-right text-primary">
                {formatMs(r.wallMs)}
              </td>
              <td className="tnum px-3 py-2 text-right">
                {formatTokens(totalTokens(r))}
              </td>
              <td className="px-3 py-2">
                <StatusMark status={r.status} />
              </td>
              <td className="px-3 py-2">
                {r.proofUrl ? (
                  <a
                    href={r.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ghost-link uppercase"
                  >
                    proof
                  </a>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex gap-3 font-mono text-[10px] uppercase tracking-widest">
                  {r.status !== "verified" && (
                    <button
                      onClick={() =>
                        moderate.mutate({ id: r.id, status: "verified" })
                      }
                      className="text-primary hover:underline"
                    >
                      verify
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() =>
                        moderate.mutate({ id: r.id, status: "rejected" })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      reject
                    </button>
                  )}
                  {r.status === "rejected" && (
                    <button
                      onClick={() =>
                        moderate.mutate({ id: r.id, status: "pending" })
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      restore
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete run #${r.id} permanently?`))
                        removeRun.mutate({ id: r.id });
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TracksManager() {
  const utils = trpc.useUtils();
  const { data: tracks } = trpc.track.list.useQuery();
  const [name, setName] = useState("");
  const [task, setTask] = useState("");
  const [rules, setRules] = useState("");

  const create = trpc.track.create.useMutation({
    onSuccess: () => {
      toast.success("Track opened");
      utils.track.list.invalidate();
      setName("");
      setTask("");
      setRules("");
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.track.remove.useMutation({
    onSuccess: () => {
      toast.success("Track and its runs deleted");
      utils.track.list.invalidate();
      utils.run.board.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (create.isPending) return;
          create.mutate({
            slug,
            name: name.trim(),
            task: task.trim(),
            rules: rules.trim() || undefined,
          });
        }}
      >
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          open a new track
        </h3>
        <div>
          <label className={fieldLabel}>Name</label>
          <input
            className={fieldInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Context Crunch"
          />
          {slug && (
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
              slug: {slug}
            </p>
          )}
        </div>
        <div>
          <label className={fieldLabel}>The fixed task</label>
          <textarea
            className={`${fieldInput} min-h-24 font-sans`}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Exact start line and stop condition."
          />
        </div>
        <div>
          <label className={fieldLabel}>Rules (optional)</label>
          <textarea
            className={`${fieldInput} min-h-20 font-sans`}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Validity bar, proof requirements."
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || task.trim().length < 4 || create.isPending}
          className="bg-primary px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-accent disabled:opacity-40"
        >
          Open track
        </button>
      </form>

      <div>
        <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          live tracks
        </h3>
        <div className="border-t border-border">
          {tracks?.map((t) => (
            <div
              key={t.id}
              className="flex items-baseline justify-between gap-4 border-b border-border py-4"
            >
              <div>
                <span className="font-semibold">{t.name}</span>
                <span className="ml-3 font-mono text-[10px] text-muted-foreground">
                  {t.slug}
                </span>
                <p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">
                  {t.task}
                </p>
              </div>
              <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest">
                <span className="tnum text-muted-foreground">
                  {t.runCount} runs
                </span>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete track "${t.name}" and ALL its runs?`,
                      )
                    )
                      remove.mutate({ id: t.id });
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTable() {
  const { data: users, isLoading } = trpc.run.users.useQuery();
  if (isLoading)
    return (
      <div className="py-16 text-center font-mono text-xs text-muted-foreground">
        LOADING RUNNERS…
      </div>
    );
  return (
    <table className="board-grid w-full text-left">
      <thead>
        <tr className="bg-[#111112] font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <th className="px-3 py-2.5 font-medium">ID</th>
          <th className="px-3 py-2.5 font-medium">Name</th>
          <th className="px-3 py-2.5 font-medium">Email</th>
          <th className="px-3 py-2.5 font-medium">Role</th>
          <th className="px-3 py-2.5 font-medium">Joined</th>
          <th className="px-3 py-2.5 font-medium">Last sign-in</th>
        </tr>
      </thead>
      <tbody className="font-mono text-xs">
        {users?.map((u) => (
          <tr key={u.id} className="hover:bg-secondary/60">
            <td className="tnum px-3 py-2 text-muted-foreground">{u.id}</td>
            <td className="px-3 py-2 font-sans text-sm">{u.name ?? "—"}</td>
            <td className="px-3 py-2 text-muted-foreground">{u.email ?? "—"}</td>
            <td className="px-3 py-2">
              {u.role === "admin" ? (
                <span className="text-primary">admin</span>
              ) : (
                <span className="text-muted-foreground">user</span>
              )}
            </td>
            <td className="tnum px-3 py-2 text-muted-foreground">
              {formatDate(u.createdAt)}
            </td>
            <td className="tnum px-3 py-2 text-muted-foreground">
              {formatDate(u.lastSignInAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Admin() {
  const { user, isLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: LOGIN_PATH,
  });
  const [tab, setTab] = useState<"runs" | "tracks" | "users">("runs");

  if (isLoading) {
    return (
      <div className="noise min-h-screen">
        <SiteHeader />
        <div className="px-[2vw] py-24 font-mono text-xs text-muted-foreground">
          CHECKING CREDENTIALS…
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="noise min-h-screen">
        <SiteHeader />
        <div className="px-[2vw] py-24">
          <p className="font-mono text-sm text-muted-foreground">
            STEWARDS ONLY — THIS IS WHERE THE DATABASE IS MANAGED.
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

  return (
    <div className="noise min-h-screen">
      <SiteHeader />
      <main className="px-[2vw] py-12">
        <h1 className="text-5xl font-bold tracking-tighter">STEWARD</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Moderation and database management. Verify what holds up, reject what
          doesn't, open new tracks, watch the runners.
        </p>

        <div className="mb-8 mt-8 flex gap-1 font-mono text-[10px] uppercase tracking-[0.2em]">
          {(["runs", "tracks", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border px-4 py-2 ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "runs"
                ? "runs queue"
                : t === "tracks"
                  ? "tracks"
                  : "runners"}
            </button>
          ))}
        </div>

        {tab === "runs" && <RunsQueue />}
        {tab === "tracks" && <TracksManager />}
        {tab === "users" && <UsersTable />}
      </main>
    </div>
  );
}
