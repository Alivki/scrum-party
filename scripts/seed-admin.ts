/**
 * Seed (or promote) an admin user. Idempotent — safe to run repeatedly.
 *
 *   bun run db:seed
 *
 * Requires the following environment variables to be set (only) at run time:
 *   ADMIN_SEED_USERNAME   the admin username
 *   ADMIN_SEED_PASSWORD   the admin password
 *
 * Both must be provided — no defaults are baked into source.
 */
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db";
import { user as userTable } from "~/lib/db/schema";

const usernameRaw = process.env.ADMIN_SEED_USERNAME;
const password = process.env.ADMIN_SEED_PASSWORD;

if (!usernameRaw || !password) {
  console.error(
    "Refusing to seed: ADMIN_SEED_USERNAME and ADMIN_SEED_PASSWORD must both be set.",
  );
  process.exit(1);
}

const username = usernameRaw.trim().toLowerCase();
const email = `${username}@scrum-party.local`;

const existing = await db
  .select()
  .from(userTable)
  .where(eq(userTable.username, username))
  .limit(1);

if (existing[0]) {
  if (existing[0].role !== "admin") {
    await db
      .update(userTable)
      .set({ role: "admin" })
      .where(eq(userTable.id, existing[0].id));
    console.log(`Promoted '${username}' to admin.`);
  } else {
    console.log(`Admin '${username}' already exists. Nothing to do.`);
  }
  process.exit(0);
}

const result = await auth.api.signUpEmail({
  body: {
    email,
    password,
    name: username,
    username,
  },
});

if (!result.user) {
  console.error("Failed to create admin user.");
  process.exit(1);
}

await db
  .update(userTable)
  .set({ role: "admin" })
  .where(eq(userTable.id, result.user.id));

console.log(`Created admin '${username}'.`);
