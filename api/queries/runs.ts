import { getDb } from "./connection";
import { runs, tracks, users } from "@db/schema";
import { and, count, desc, eq, ne, sql } from "drizzle-orm";

const runnerFields = {
  id: runs.id,
  userId: runs.userId,
  trackId: runs.trackId,
  model: runs.model,
  provider: runs.provider,
  harness: runs.harness,
  wallMs: runs.wallMs,
  tokensIn: runs.tokensIn,
  tokensOut: runs.tokensOut,
  costUsd: runs.costUsd,
  proofUrl: runs.proofUrl,
  notes: runs.notes,
  status: runs.status,
  createdAt: runs.createdAt,
  runnerName: users.name,
  trackName: tracks.name,
  trackSlug: tracks.slug,
};

/** Public board rows — rejected runs never leave the moderation queue. */
export async function listBoardRuns(options?: {
  trackId?: number;
  includePending?: boolean;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [ne(runs.status, "rejected")];
  if (options?.trackId) conditions.push(eq(runs.trackId, options.trackId));
  if (!options?.includePending) conditions.push(ne(runs.status, "pending"));
  return db
    .select(runnerFields)
    .from(runs)
    .innerJoin(users, eq(runs.userId, users.id))
    .innerJoin(tracks, eq(runs.trackId, tracks.id))
    .where(and(...conditions))
    .orderBy(desc(runs.createdAt))
    .limit(options?.limit ?? 200);
}

export async function getRunById(id: number) {
  const [row] = await getDb()
    .select(runnerFields)
    .from(runs)
    .innerJoin(users, eq(runs.userId, users.id))
    .innerJoin(tracks, eq(runs.trackId, tracks.id))
    .where(eq(runs.id, id))
    .limit(1);
  return row ?? null;
}

export async function listRunsByUser(userId: number) {
  return getDb()
    .select(runnerFields)
    .from(runs)
    .innerJoin(users, eq(runs.userId, users.id))
    .innerJoin(tracks, eq(runs.trackId, tracks.id))
    .where(eq(runs.userId, userId))
    .orderBy(desc(runs.createdAt));
}

/** Moderation queue: everything, pending first. Admin only. */
export async function listAllRunsForAdmin() {
  return getDb()
    .select(runnerFields)
    .from(runs)
    .innerJoin(users, eq(runs.userId, users.id))
    .innerJoin(tracks, eq(runs.trackId, tracks.id))
    .orderBy(
      sql`case when ${runs.status} = 'pending' then 0 when ${runs.status} = 'verified' then 1 else 2 end`,
      desc(runs.createdAt),
    );
}

export async function createRun(data: {
  userId: number;
  trackId: number;
  model: string;
  provider: string;
  harness?: string;
  wallMs: number;
  tokensIn: number;
  tokensOut: number;
  costUsd?: number;
  proofUrl?: string;
  notes?: string;
}) {
  const db = getDb();
  const [{ id }] = await db.insert(runs).values(data).$returningId();
  return getRunById(id);
}

export async function setRunStatus(
  id: number,
  status: "pending" | "verified" | "rejected",
) {
  await getDb().update(runs).set({ status }).where(eq(runs.id, id));
  return getRunById(id);
}

export async function deleteRun(id: number) {
  await getDb().delete(runs).where(eq(runs.id, id));
}

export async function boardStats() {
  const db = getDb();
  const [row] = await db
    .select({
      totalRuns: count(),
      totalTokens: sql<number>`coalesce(sum(${runs.tokensIn} + ${runs.tokensOut}), 0)`,
      distinctModels: sql<number>`count(distinct ${runs.model})`,
      distinctRunners: sql<number>`count(distinct ${runs.userId})`,
    })
    .from(runs)
    .where(ne(runs.status, "rejected"));
  const [trackRow] = await db.select({ total: count() }).from(tracks);
  return {
    totalRuns: row?.totalRuns ?? 0,
    totalTokens: Number(row?.totalTokens ?? 0),
    distinctModels: Number(row?.distinctModels ?? 0),
    distinctRunners: Number(row?.distinctRunners ?? 0),
    totalTracks: trackRow?.total ?? 0,
  };
}
