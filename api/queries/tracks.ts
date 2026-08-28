import { getDb } from "./connection";
import { tracks, runs } from "@db/schema";
import { count, eq, ne, sql } from "drizzle-orm";

export async function listTracks() {
  const db = getDb();
  const allTracks = await db.select().from(tracks).orderBy(tracks.id);
  const counts = await db
    .select({
      trackId: runs.trackId,
      total: count(),
      verified: sql<number>`sum(case when ${runs.status} = 'verified' then 1 else 0 end)`,
    })
    .from(runs)
    .where(ne(runs.status, "rejected"))
    .groupBy(runs.trackId);
  const byTrack = new Map(counts.map((c) => [c.trackId, c]));
  return allTracks.map((t) => ({
    ...t,
    runCount: byTrack.get(t.id)?.total ?? 0,
    verifiedCount: Number(byTrack.get(t.id)?.verified ?? 0),
  }));
}

export async function getTrackBySlug(slug: string) {
  return getDb().query.tracks.findFirst({ where: eq(tracks.slug, slug) });
}

export async function createTrack(data: {
  slug: string;
  name: string;
  task: string;
  rules?: string;
}) {
  const db = getDb();
  const [{ id }] = await db.insert(tracks).values(data).$returningId();
  return db.query.tracks.findFirst({ where: eq(tracks.id, id) });
}

export async function updateTrack(
  id: number,
  data: { name?: string; task?: string; rules?: string },
) {
  const db = getDb();
  await db.update(tracks).set(data).where(eq(tracks.id, id));
  return db.query.tracks.findFirst({ where: eq(tracks.id, id) });
}

export async function deleteTrack(id: number) {
  const db = getDb();
  await db.delete(runs).where(eq(runs.trackId, id));
  await db.delete(tracks).where(eq(tracks.id, id));
}

export async function countRunsByTrack(trackId: number) {
  const [row] = await getDb()
    .select({ total: count() })
    .from(runs)
    .where(eq(runs.trackId, trackId));
  return row?.total ?? 0;
}
