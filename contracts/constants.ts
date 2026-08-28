export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;

/** Run publication lifecycle — keep in sync with db/schema.ts runs.status enum. */
export const RUN_STATUSES = ["pending", "verified", "rejected"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/** Board sort options shared by the leaderboard UI. */
export const BOARD_SORTS = ["time", "tokens", "cost", "recent"] as const;
export type BoardSort = (typeof BOARD_SORTS)[number];
