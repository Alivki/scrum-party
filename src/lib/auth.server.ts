import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { db } from "~/lib/db";
import * as schema from "~/lib/db/schema";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const trustedOrigins = Array.from(
  new Set(
    [
      baseURL,
      "http://localhost:3000",
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ],
  ),
);

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error(
    "BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env.local (or your hosting provider).",
  );
}

export const auth = betterAuth({
  baseURL,
  secret,
  trustedOrigins,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  // username plugin requires email/password to be enabled; we use a synthetic
  // email per signup since the user-facing form only asks for name + password.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },

  user: {
    additionalFields: {
      avatar: {
        type: "string",
        required: false,
      },
    },
  },

  advanced: {
    cookiePrefix: "scrum-party",
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },

  plugins: [
    username({
      minUsernameLength: 1,
      maxUsernameLength: 40,
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],

});

export type Session = typeof auth.$Infer.Session;
