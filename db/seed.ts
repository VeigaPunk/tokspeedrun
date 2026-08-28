import { getDb } from "../api/queries/connection";
import { tracks } from "./schema";
import { eq } from "drizzle-orm";

const SEED_TRACKS = [
  {
    slug: "hello-benchmark",
    name: "Hello, Benchmark",
    task:
      "From a cold start, make the agent clone a repo, find the failing test, and turn it green. " +
      "Clock stops at the first green run of the full test suite.",
    rules:
      "One continuous session. No pre-written patch. Paste the terminal log or CI link as proof. " +
      "Token meter = provider-reported input + output tokens for the whole session.",
  },
  {
    slug: "repo-spelunk",
    name: "Repo Spelunk",
    task:
      "Point the agent at an unfamiliar monorepo and ask: \"where does X happen, and why does it break when Y?\" " +
      "Clock stops when the answer cites the exact file, line, and root cause.",
    rules:
      "The runner must not have read the repo beforehand. Answer must name file + line. " +
      "Wrong root cause = run invalid.",
  },
  {
    slug: "ship-it",
    name: "Ship It",
    task:
      "Zero to deployed landing page: scaffold, design, build, and push. " +
      "Clock stops when the public URL returns 200.",
    rules:
      "Start from an empty directory. Templates allowed if declared in the notes. " +
      "Screenshot + URL required as proof.",
  },
  {
    slug: "token-miser",
    name: "Token Miser",
    task:
      "Complete the same fixed bug-fix task as Hello, Benchmark — but ranked by fewest total tokens " +
      "instead of wall time. Efficiency is the speedrun.",
    rules:
      "Same validity bar as Hello, Benchmark. Ranking metric is input + output tokens; " +
      "ties broken by wall time. Reported cost in USD optional but respected.",
  },
];

async function seed() {
  const db = getDb();
  console.log("Seeding tracks...");

  for (const t of SEED_TRACKS) {
    const existing = await db.query.tracks.findFirst({
      where: eq(tracks.slug, t.slug),
    });
    if (existing) {
      console.log(`- ${t.slug}: already exists, skipping`);
      continue;
    }
    await db.insert(tracks).values(t);
    console.log(`- ${t.slug}: created`);
  }

  console.log("Done.");
  process.exit(0); // close MySQL connection pool
}

seed();
