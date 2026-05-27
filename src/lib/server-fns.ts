import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db";
import { issue as issueTable, user as userTable } from "~/lib/db/schema";
import type {
  BurndownPoint,
  Issue,
  IssueStatus,
  IssueWithUser,
  LeaderboardEntry,
  User,
} from "~/lib/types";
import {
  calcAlcoholUnits,
  calcStoryPoints,
  estimatedPromille,
} from "~/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

async function getSession() {
  const req = getRequest();
  if (!req) return null;
  return auth.api.getSession({ headers: req.headers });
}

async function requireUser() {
  const session = await getSession();
  if (!session?.user) throw new Error("Ikke pålogget.");
  return session.user;
}

async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("Kun admin.");
  return u;
}

function rowToUser(r: typeof userTable.$inferSelect): User {
  return {
    id: r.id,
    name: r.name,
    avatar: r.avatar ?? null,
    role: (r.role as "user" | "admin") ?? "user",
    createdAt: r.createdAt.getTime(),
  };
}

function rowToIssue(r: typeof issueTable.$inferSelect): Issue {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    storyPoints: r.storyPoints,
    drinkName: r.drinkName,
    drinkSizeMl: r.drinkSizeMl,
    alcoholPercent: r.alcoholPercent,
    status: r.status as IssueStatus,
    position: r.position,
    completedAt: r.completedAt?.getTime() ?? null,
    createdAt: r.createdAt.getTime(),
  };
}

function uid() {
  return crypto.randomUUID();
}

const StatusEnum = z.enum([
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
]);

const IssueInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  drinkName: z.string().trim().min(1).max(60),
  drinkSizeMl: z.number().int().min(10).max(3000),
  alcoholPercent: z.number().min(0).max(96),
  quantity: z.number().int().min(1).max(20).optional().default(1),
});

const UpdateIssueSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  drinkName: z.string().trim().min(1).max(60),
  drinkSizeMl: z.number().int().min(10).max(3000),
  alcoholPercent: z.number().min(0).max(96),
});

const MoveIssueSchema = z.object({
  id: z.string().min(1),
  status: StatusEnum,
  position: z.number().int().min(0),
});

/* -------------------------------------------------------------------------- */
/*  User-facing fns                                                           */
/* -------------------------------------------------------------------------- */

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession();
    if (!session?.user) return null;
    const rows = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);
    const row = rows[0];
    return row ? rowToUser(row) : null;
  },
);

export const updateAvatar = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ avatar: z.string().nullable() }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireUser();
    await db
      .update(userTable)
      .set({ avatar: data.avatar })
      .where(eq(userTable.id, u.id));
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(40),
        avatar: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireUser();
    const update: Partial<typeof userTable.$inferInsert> = {
      name: data.name,
      updatedAt: new Date(),
    };
    if (data.avatar !== undefined) update.avatar = data.avatar;
    await db.update(userTable).set(update).where(eq(userTable.id, u.id));
    const rows = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, u.id))
      .limit(1);
    return rows[0] ? rowToUser(rows[0]) : null;
  });

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select()
    .from(userTable)
    .orderBy(asc(userTable.createdAt));
  return rows.map(rowToUser);
});

export const getUser = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, data.id))
      .limit(1);
    return rows[0] ? rowToUser(rows[0]) : null;
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.delete(userTable).where(eq(userTable.id, data.id));
    return { ok: true };
  });

export const listIssues = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().min(1).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const q = db.select().from(issueTable);
    const rows = data.userId
      ? await q
          .where(eq(issueTable.userId, data.userId))
          .orderBy(asc(issueTable.position), asc(issueTable.createdAt))
      : await q.orderBy(asc(issueTable.position), asc(issueTable.createdAt));
    return rows.map(rowToIssue);
  });

export const listIssuesWithUsers = createServerFn({ method: "GET" }).handler(
  async () => {
    const rows = await db
      .select({ issue: issueTable, user: userTable })
      .from(issueTable)
      .innerJoin(userTable, eq(issueTable.userId, userTable.id))
      .orderBy(asc(issueTable.position), asc(issueTable.createdAt));
    const out: IssueWithUser[] = rows.map((r) => ({
      ...rowToIssue(r.issue),
      user: rowToUser(r.user),
    }));
    return out;
  },
);

export const createIssues = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IssueInputSchema.parse(d))
  .handler(async ({ data }) => {
    const u = await requireUser();
    const storyPoints = calcStoryPoints(data.drinkSizeMl, data.alcoholPercent);
    const maxRow = await db
      .select({ max: max(issueTable.position) })
      .from(issueTable)
      .where(
        and(eq(issueTable.userId, u.id), eq(issueTable.status, "todo")),
      );
    let position = (maxRow[0]?.max ?? -1) + 1;
    const now = new Date();
    const qty = data.quantity ?? 1;
    const created: Issue[] = [];
    for (let i = 0; i < qty; i++) {
      const id = uid();
      await db.insert(issueTable).values({
        id,
        userId: u.id,
        title: data.title,
        storyPoints,
        drinkName: data.drinkName,
        drinkSizeMl: data.drinkSizeMl,
        alcoholPercent: data.alcoholPercent,
        status: "todo",
        position,
        completedAt: null,
        createdAt: new Date(now.getTime() + i),
      });
      position += 1;
      const rows = await db
        .select()
        .from(issueTable)
        .where(eq(issueTable.id, id))
        .limit(1);
      if (rows[0]) created.push(rowToIssue(rows[0]));
    }
    return created;
  });

export const updateIssue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpdateIssueSchema.parse(d))
  .handler(async ({ data }) => {
    const u = await requireUser();
    const storyPoints = calcStoryPoints(data.drinkSizeMl, data.alcoholPercent);
    await db
      .update(issueTable)
      .set({
        title: data.title,
        storyPoints,
        drinkName: data.drinkName,
        drinkSizeMl: data.drinkSizeMl,
        alcoholPercent: data.alcoholPercent,
      })
      .where(and(eq(issueTable.id, data.id), eq(issueTable.userId, u.id)));
    const rows = await db
      .select()
      .from(issueTable)
      .where(eq(issueTable.id, data.id))
      .limit(1);
    if (!rows[0]) throw new Error("Issue not found");
    return rowToIssue(rows[0]);
  });

export const deleteIssue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireUser();
    if (u.role === "admin") {
      await db.delete(issueTable).where(eq(issueTable.id, data.id));
    } else {
      await db
        .delete(issueTable)
        .where(and(eq(issueTable.id, data.id), eq(issueTable.userId, u.id)));
    }
    return { ok: true };
  });

export const moveIssue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MoveIssueSchema.parse(d))
  .handler(async ({ data }) => {
    const u = await requireUser();
    const rows = await db
      .select()
      .from(issueTable)
      .where(eq(issueTable.id, data.id))
      .limit(1);
    const existing = rows[0];
    if (!existing) throw new Error("Issue not found");
    if (existing.userId !== u.id) throw new Error("Ikke din issue.");
    const completedAt =
      data.status === "done"
        ? (existing.completedAt ?? new Date())
        : null;
    await db
      .update(issueTable)
      .set({
        status: data.status,
        completedAt,
        position: data.position,
      })
      .where(eq(issueTable.id, data.id));
    const updated = await db
      .select()
      .from(issueTable)
      .where(eq(issueTable.id, data.id))
      .limit(1);
    return rowToIssue(updated[0]!);
  });

/* -------------------------------------------------------------------------- */
/*  Leaderboard + burndown                                                    */
/* -------------------------------------------------------------------------- */

export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async () => {
    // Returns ALL users — including admins — so per-user views can still
    // resolve their own stats. The client filters admins out of the
    // leaderboard display and participant count.
    const users = await db
      .select()
      .from(userTable)
      .orderBy(asc(userTable.createdAt));
    const issues = await db.select().from(issueTable);
    const now = Date.now();
    const entries: LeaderboardEntry[] = users.map((u) => {
      const mine = issues.filter((i) => i.userId === u.id);
      const done = mine.filter((i) => i.status === "done");
      const pointsClosed = done.reduce((s, i) => s + i.storyPoints, 0);
      const pointsTotal = mine.reduce((s, i) => s + i.storyPoints, 0);
      const totalAlcoholUnits = done.reduce(
        (s, i) => s + calcAlcoholUnits(i.drinkSizeMl, i.alcoholPercent),
        0,
      );
      const promille = estimatedPromille(
        done
          .filter((d) => d.completedAt)
          .map((d) => ({
            sizeMl: d.drinkSizeMl,
            percent: d.alcoholPercent,
            atMs: d.completedAt!.getTime(),
          })),
        now,
      );
      return {
        user: rowToUser(u),
        pointsClosed,
        pointsTotal,
        drinksClosed: done.length,
        totalAlcoholUnits: Math.round(totalAlcoholUnits * 10) / 10,
        estimatedPromille: promille,
      };
    });
    entries.sort((a, b) => {
      if (b.pointsClosed !== a.pointsClosed)
        return b.pointsClosed - a.pointsClosed;
      return b.drinksClosed - a.drinksClosed;
    });
    return entries;
  },
);

const PARTY_START_HOUR = 18;
const PARTY_END_HOUR = 23;
const PARTY_TIME_ZONE = "Europe/Oslo";
const BUCKET_MS = 15 * 60 * 1000;

function datePartsInTimeZone(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

function timeZoneOffsetMs(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second),
  );
  return asUtc - ms;
}

function zonedTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZone: string,
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, 0, 0, 0);
  return utcGuess - timeZoneOffsetMs(utcGuess, timeZone);
}

function partyTimeline(referenceMs: number) {
  const { year, month, day } = datePartsInTimeZone(
    referenceMs,
    PARTY_TIME_ZONE,
  );
  const start = zonedTimeToUtcMs(
    year,
    month,
    day,
    PARTY_START_HOUR,
    PARTY_TIME_ZONE,
  );
  const end = zonedTimeToUtcMs(
    year,
    month,
    day,
    PARTY_END_HOUR,
    PARTY_TIME_ZONE,
  );
  const buckets: number[] = [];
  for (let t = start; t <= end; t += BUCKET_MS) buckets.push(t);
  return { buckets, now: Date.now() };
}

 function seriesFromIssues(rows: (typeof issueTable.$inferSelect)[]) {
  const { buckets, now } = partyTimeline(Date.now());
  const partyStart = buckets[0]!;
  const partyEnd = buckets[buckets.length - 1]!;
  const partySpan = Math.max(1, partyEnd - partyStart);

  if (rows.length === 0)
    return {
      series: [] as BurndownPoint[],
      totalPoints: 0,
      partyStart,
      partyEnd,
    };

  const totalPoints = rows.reduce((s, i) => s + i.storyPoints, 0);

  const idealAt = (t: number) => {
    const clamped = Math.min(Math.max(t, partyStart), partyEnd);
    const frac = (clamped - partyStart) / partySpan;
    return Math.round(totalPoints * (1 - frac) * 10) / 10;
  };

  const closeEvents = rows
    .filter((i) => i.status === "done" && i.completedAt)
    .map((i) => ({
      at: i.completedAt!.getTime(),
      points: i.storyPoints,
    }))
    .sort((a, b) => a.at - b.at);

  const burnedBeforeStart = closeEvents
    .filter((c) => c.at < partyStart)
    .reduce((s, c) => s + c.points, 0);

  const sampleSet = new Set<number>([partyStart]);
  for (const c of closeEvents) {
    if (c.at >= partyStart && c.at <= partyEnd) sampleSet.add(c.at);
  }
  for (const b of buckets) {
    if (b <= now) sampleSet.add(b);
  }
  if (now >= partyStart && now <= partyEnd) sampleSet.add(now);

  const samples = Array.from(sampleSet).sort((a, b) => a - b);

  const series: BurndownPoint[] = samples.map((t) => {
    const burnedDuring = closeEvents
      .filter((c) => c.at >= partyStart && c.at <= t)
      .reduce((s, c) => s + c.points, 0);
    const remaining = Math.max(
      0,
      totalPoints - burnedBeforeStart - burnedDuring,
    );
    return {
      date: new Date(t).toISOString(),
      remaining,
      ideal: idealAt(t),
      isFuture: t > now,
    };
  });

  return { series, totalPoints, partyStart, partyEnd };
}

export const getBurndown = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(issueTable)
      .where(eq(issueTable.userId, data.userId));
    return seriesFromIssues(rows);
  });

export const getSharedBurndown = createServerFn({ method: "GET" }).handler(
  async () => {
    const rows = await db.select().from(issueTable);
    return seriesFromIssues(rows);
  },
);
