# scrum-party

A scoreboard for a night of drinking, dressed up as a sprint board.

Built for the **dataingeniør / systemutvikling** end-of-semester party.
Every drink is an issue. Story points are how heavy it hit. The board
burns down as the night goes on, and the leaderboard rearranges in
real time. The joke is taking Scrum vocabulary completely seriously
for an evening that has nothing to do with software.

## What's in here

- A live **kanban board** per user (Todo → In progress → Blocked → Review → Done).
- A **shared "Felles" view** with everyone's boards, a real-time leaderboard,
  and a shared burndown chart projected against an ideal-velocity line.
- Per-user burndowns and a public profile page.
- Username + password auth, with an admin role for cleanup.
- Norwegian-language UI, mock-formal scrum-speak.

There's a bit more context in [`PRODUCT.md`](./PRODUCT.md) and
[`DESIGN.md`](./DESIGN.md) — the product brief and the visual system the
UI was built against.

## Stack

- **Runtime**: Bun
- **Framework**: TanStack Start (SSR React) + Router + Query + Form
- **DB**: Postgres via Drizzle ORM
- **Auth**: Better Auth (username plugin, admin plugin, HTTP-only cookie sessions)
- **UI**: Tailwind v3, custom OKLCH design tokens, Radix primitives
- **Kanban**: @dnd-kit
- **Charts**: Recharts

## Run it locally

You need [Bun](https://bun.sh) and Docker.

```bash
# 1. Postgres
bun run db:up

# 2. Local env vars (none are committed)
cp .env.example .env.local
$EDITOR .env.local
#   BETTER_AUTH_SECRET   →  openssl rand -base64 32
#   ADMIN_SEED_PASSWORD  →  whatever you want to log in as

# 3. Apply schema + seed the bootstrap admin
bun run db:push
bun run db:seed

# 4. Install + run
bun install
bun run dev
```

Then open `http://localhost:3000` and sign in as the admin you seeded.

### Subsequent runs

```bash
bun run db:up
bun run dev
```

Schema changes? `bun run db:push` again — it's idempotent and only
applies the diff. Want a fresh DB? `bun run db:down && bun run db:up &&
bun run db:push && bun run db:seed`.

### Poking at the data

- **Drizzle Studio**: `bun run db:studio` opens a browser UI at
  https://local.drizzle.studio.
- **psql in the container**:
  ```bash
  docker exec -it scrum-party-db psql -U scrum_party -d scrum_party
  ```
- **Any GUI client** (TablePlus, DBeaver, Postico): connect to
  `localhost:5432`, db/user/password all `scrum_party`.

### Production build

```bash
bun run build
bun run start
```

## Auth notes

- Sessions are HTTP-only cookies (Better Auth). Not localStorage.
- **The only way to create an admin is `bun run db:seed`** with
  `ADMIN_SEED_USERNAME` + `ADMIN_SEED_PASSWORD` set. There is no env-var
  auto-promote. The seed is idempotent — it'll promote an existing user
  with that username if they already exist.
- Admins are excluded from the leaderboard and the participant count in
  the UI.

## Security posture

- **No secrets in source.** `BETTER_AUTH_SECRET` and
  `ADMIN_SEED_PASSWORD` have no fallbacks — the app refuses to start
  without them. `.env.local` is gitignored.
- **Sessions in HTTP-only cookies** — not readable from page JS, so XSS
  can't steal a session.
- **CSRF**: same-site cookies + Better Auth's origin validation against
  `trustedOrigins`.
- **SQL injection**: all queries go through Drizzle's parameterised API.
- **Server-derived user**: every server function calls `requireUser()` /
  `requireAdmin()` and reads the session from the cookie. Clients can't
  impersonate by sending a `userId`.
- **No password hashing in app code** — Better Auth uses scrypt
  internally.

## License

MIT.
