import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";

const fieldLabel =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground";
const fieldInput =
  "w-full border border-input bg-transparent px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-primary placeholder:text-muted-foreground/50";

export default function Submit() {
  const { isAuthenticated, isLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: LOGIN_PATH,
  });
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: tracks } = trpc.track.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [trackId, setTrackId] = useState<number | "">("");
  const [model, setModel] = useState("");
  const [provider, setProvider] = useState("");
  const [harness, setHarness] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [centis, setCentis] = useState("");
  const [tokensIn, setTokensIn] = useState("");
  const [tokensOut, setTokensOut] = useState("");
  const [costUsd, setCostUsd] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");

  const create = trpc.run.create.useMutation({
    onSuccess: async (run) => {
      await Promise.all([
        utils.run.board.invalidate(),
        utils.run.stats.invalidate(),
        utils.run.recent.invalidate(),
      ]);
      toast.success("Run published — pending verification.");
      if (run) navigate(`/runs/${run.id}`);
      else navigate("/board");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="noise min-h-screen">
        <SiteHeader />
        <div className="px-[2vw] py-24 font-mono text-xs text-muted-foreground">
          CHECKING CREDENTIALS…
        </div>
      </div>
    );
  }

  const wallMs = () => {
    const m = Number(minutes || 0);
    const s = Number(seconds || 0);
    const c = Number((centis || "0").padEnd(2, "0").slice(0, 2));
    return m * 60_000 + s * 1_000 + c * 10;
  };

  const valid =
    trackId !== "" &&
    model.trim().length > 0 &&
    provider.trim().length > 0 &&
    wallMs() > 0 &&
    Number(tokensOut || 0) > 0;

  return (
    <div className="noise min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-[2vw] py-14">
        <h1 className="text-5xl font-bold tracking-tighter">PUBLISH A RUN</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          It lands on the board immediately as{" "}
          <span className="text-foreground">unverified</span>. A steward checks
          the proof and marks it verified — or rejects it. Times without proof
          tend not to stand.
        </p>

        <form
          className="mt-10 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid || create.isPending) return;
            create.mutate({
              trackId: Number(trackId),
              model: model.trim(),
              provider: provider.trim(),
              harness: harness.trim() || undefined,
              wallMs: wallMs(),
              tokensIn: Number(tokensIn || 0),
              tokensOut: Number(tokensOut || 0),
              costUsd: costUsd ? Number(costUsd) : undefined,
              proofUrl: proofUrl.trim() || undefined,
              notes: notes.trim() || undefined,
            });
          }}
        >
          <div>
            <label className={fieldLabel}>Track</label>
            <select
              className={fieldInput}
              value={trackId}
              onChange={(e) =>
                setTrackId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="" disabled>
                Choose the fixed task you raced
              </option>
              {tracks?.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">
                  {t.name}
                </option>
              ))}
            </select>
            {trackId !== "" && (
              <p className="mt-2 border-l-2 border-primary pl-3 text-xs leading-relaxed text-muted-foreground">
                {tracks?.find((t) => t.id === trackId)?.task}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className={fieldLabel}>Model</label>
              <input
                className={fieldInput}
                placeholder="kimi-k3"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div>
              <label className={fieldLabel}>Provider</label>
              <input
                className={fieldInput}
                placeholder="moonshot"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
            <div>
              <label className={fieldLabel}>Harness / CLI (optional)</label>
              <input
                className={fieldInput}
                placeholder="kimi code"
                value={harness}
                onChange={(e) => setHarness(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Wall time — clock stops when done</label>
            <div className="flex items-center gap-2 font-mono">
              <input
                className={`${fieldInput} tnum w-24 text-right`}
                placeholder="00"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
              />
              <span className="text-muted-foreground">m</span>
              <input
                className={`${fieldInput} tnum w-24 text-right`}
                placeholder="00"
                inputMode="numeric"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value.replace(/\D/g, ""))}
              />
              <span className="text-muted-foreground">s</span>
              <input
                className={`${fieldInput} tnum w-24 text-right`}
                placeholder="00"
                inputMode="numeric"
                value={centis}
                onChange={(e) => setCentis(e.target.value.replace(/\D/g, ""))}
              />
              <span className="text-muted-foreground">cs</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className={fieldLabel}>Tokens in</label>
              <input
                className={`${fieldInput} tnum`}
                placeholder="18420"
                inputMode="numeric"
                value={tokensIn}
                onChange={(e) => setTokensIn(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label className={fieldLabel}>Tokens out</label>
              <input
                className={`${fieldInput} tnum`}
                placeholder="3102"
                inputMode="numeric"
                value={tokensOut}
                onChange={(e) => setTokensOut(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label className={fieldLabel}>Cost USD (optional)</label>
              <input
                className={`${fieldInput} tnum`}
                placeholder="0.0431"
                inputMode="decimal"
                value={costUsd}
                onChange={(e) =>
                  setCostUsd(e.target.value.replace(/[^\d.]/g, ""))
                }
              />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Proof URL — log, CI run, recording</label>
            <input
              className={fieldInput}
              placeholder="https://github.com/you/repo/actions/runs/…"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabel}>Notes (optional)</label>
            <textarea
              className={`${fieldInput} min-h-28 resize-y font-sans`}
              placeholder="Setup, declared templates, anything a steward should know."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!valid || create.isPending}
            className="bg-primary px-8 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {create.isPending ? "Publishing…" : "Publish the run"}
          </button>
        </form>
      </main>
    </div>
  );
}
