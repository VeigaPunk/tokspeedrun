import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { RUN_STATUSES } from "@contracts/constants";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import {
  listBoardRuns,
  getRunById,
  listRunsByUser,
  listAllRunsForAdmin,
  createRun,
  setRunStatus,
  deleteRun,
  boardStats,
} from "./queries/runs";
import { getDb } from "./queries/connection";

export const runRouter = createRouter({
  /** Public leaderboard rows (rejected runs hidden; pending shown as unverified). */
  board: publicQuery
    .input(
      z
        .object({
          trackId: z.number().optional(),
          includePending: z.boolean().optional(),
          limit: z.number().min(1).max(500).optional(),
        })
        .optional(),
    )
    .query(({ input }) => listBoardRuns(input)),

  recent: publicQuery
    .input(z.object({ limit: z.number().min(1).max(50) }).optional())
    .query(({ input }) => listBoardRuns({ limit: input?.limit ?? 12 })),

  stats: publicQuery.query(() => boardStats()),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const run = await getRunById(input.id);
      if (!run || run.status === "rejected") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      }
      return run;
    }),

  /** Publish a run. Signed-in users only; lands on the board as pending. */
  create: authedQuery
    .input(
      z.object({
        trackId: z.number(),
        model: z.string().min(1).max(255),
        provider: z.string().min(1).max(255),
        harness: z.string().max(255).optional(),
        wallMs: z.number().int().min(1).max(24 * 60 * 60 * 1000),
        tokensIn: z.number().int().min(0),
        tokensOut: z.number().int().min(0),
        costUsd: z.number().min(0).max(10000).optional(),
        proofUrl: z.string().url().max(512).optional().or(z.literal("")),
        notes: z.string().max(4000).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createRun({
        userId: ctx.user.id,
        trackId: input.trackId,
        model: input.model,
        provider: input.provider,
        harness: input.harness || undefined,
        wallMs: input.wallMs,
        tokensIn: input.tokensIn,
        tokensOut: input.tokensOut,
        costUsd: input.costUsd,
        proofUrl: input.proofUrl || undefined,
        notes: input.notes || undefined,
      }),
    ),

  mine: authedQuery.query(({ ctx }) => listRunsByUser(ctx.user.id)),

  /** Remove own run (admins can remove any). */
  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const run = await getRunById(input.id);
      if (!run) throw new TRPCError({ code: "NOT_FOUND" });
      if (run.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteRun(input.id);
    }),

  // ---- moderation (admin) ----
  queue: adminQuery.query(() => listAllRunsForAdmin()),

  moderate: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(RUN_STATUSES) }))
    .mutation(({ input }) => setRunStatus(input.id, input.status)),

  users: adminQuery.query(() => getDb().query.users.findMany()),
});
