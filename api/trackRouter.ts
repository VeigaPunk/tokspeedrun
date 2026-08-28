import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import {
  listTracks,
  getTrackBySlug,
  createTrack,
  updateTrack,
  deleteTrack,
} from "./queries/tracks";

const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only");

export const trackRouter = createRouter({
  list: publicQuery.query(() => listTracks()),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getTrackBySlug(input.slug)),

  create: adminQuery
    .input(
      z.object({
        slug: slugSchema,
        name: z.string().min(2).max(255),
        task: z.string().min(4),
        rules: z.string().optional(),
      }),
    )
    .mutation(({ input }) => createTrack(input)),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).max(255).optional(),
        task: z.string().min(4).optional(),
        rules: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateTrack(id, data);
    }),

  remove: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTrack(input.id)),
});
