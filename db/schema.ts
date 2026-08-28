import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  double,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * A track is a fixed, repeatable task that runners race against —
 * the "category" in speedrunning terms. Admin-managed.
 */
export const tracks = mysqlTable("tracks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  task: text("task").notNull(),
  rules: text("rules"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * A run is one published attempt on a track: wall time, token meter,
 * cost, and proof. Runs are public immediately as "pending" and an
 * admin marks them verified or rejected (rejected runs leave the board).
 */
export const runs = mysqlTable(
  "runs",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    trackId: bigint("trackId", { mode: "number", unsigned: true }).notNull(),
    model: varchar("model", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    harness: varchar("harness", { length: 255 }),
    wallMs: int("wallMs").notNull(),
    tokensIn: int("tokensIn").notNull().default(0),
    tokensOut: int("tokensOut").notNull().default(0),
    costUsd: double("costUsd"),
    proofUrl: varchar("proofUrl", { length: 512 }),
    notes: text("notes"),
    status: mysqlEnum("status", ["pending", "verified", "rejected"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    trackIdx: index("runs_track_idx").on(table.trackId),
    statusIdx: index("runs_status_idx").on(table.status),
    userIdx: index("runs_user_idx").on(table.userId),
  }),
);

export type Run = typeof runs.$inferSelect;
export type InsertRun = typeof runs.$inferInsert;
