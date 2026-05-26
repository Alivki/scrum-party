# scrum-party

Codename for the **Scrumfest** event app — dataingeniør · scrumfest iterasjon 1.

---

## First-time local setup

```bash
# 1. Postgres (Docker)
bun run db:up

# 2. Local env vars — must be filled in, none are committed.
cp .env.example .env.local
$EDITOR .env.local
#   - BETTER_AUTH_SECRET: openssl rand -base64 32
#   - ADMIN_SEED_PASSWORD: a strong password you'll use to log in as admin

# 3. Push schema + seed the bootstrap admin
bun run db:push
bun run db:seed

# 4. Install + dev
bun install
bun run dev
```

Open http://localhost:3000 and sign in as the admin you just seeded.

## Subsequent runs

```bash
bun run db:up    # bring Postgres back if it's not running
bun run dev
```

Schema changes? `bun run db:push` again (idempotent — only applies the diff). Want a fresh DB? `bun run db:down && bun run db:up && bun run db:push && bun run db:seed`.

## Inspecting the data

Three options:

- **Drizzle Studio** (web UI): `bun run db:studio` → opens https://local.drizzle.studio
- **psql** in the container:
  ```bash
  docker exec -it scrum-party-db psql -U scrum_party -d scrum_party
  ```
- **Any GUI client** (TablePlus / DBeaver / Postico) — connect to `localhost:5432`, db/user/password all `scrum_party`.

## Auth notes

- HTTP-only cookie sessions (Better Auth). Not localStorage.
- **The only way to create an admin is `bun run db:seed`** with `ADMIN_SEED_USERNAME` + `ADMIN_SEED_PASSWORD` set. No env-var auto-promote. The seed is idempotent and will promote an existing user with that username if it already exists.
- Admins are excluded from the leaderboard and participant count in the UI.

---

## Production build

```bash
bun run build
bun run start
```

---

## Deploying to Railway (internal DB)

One Railway **project**, two services: the app and Postgres. The app reaches the DB over Railway's **private network** — traffic never leaves the platform.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "scrum-party"
gh repo create scrum-party --private --source=. --push
```

### 2. Create the project + services

1. railway.app → **New Project** → **Deploy from GitHub repo** → pick the repo.
2. In the same project: **+ New → Database → Add PostgreSQL**.

### 3. App service environment variables

On the **app** service → **Variables** tab. Use Railway reference variables so the DB URL is templated:

| Key | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | a long random string (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | your generated Railway domain, e.g. `https://scrum-party.up.railway.app` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | (optional) extra origins, comma-separated |
| `ADMIN_SEED_USERNAME` | the bootstrap admin username |
| `ADMIN_SEED_PASSWORD` | the bootstrap admin password (strong, never committed) |

The `${{Postgres.DATABASE_URL}}` reference resolves to the **internal** Railway URL (`postgresql://...@postgres.railway.internal:5432/railway`). Outbound traffic to your DB never leaves Railway's network.

### 4. Build + start commands

App service → **Settings → Build & Deploy**:

- **Build Command**: `bun install && bun run build && bun run db:push && bun run db:seed`
- **Start Command**: `bun run start`

Both `db:push` and `db:seed` are idempotent — safe to run on every deploy. `db:seed` creates the admin user (or promotes an existing user with that username to admin).

### 5. Generate a public domain

App service → **Settings → Networking → Generate Domain**.

Copy that URL into the `BETTER_AUTH_URL` env var and redeploy. HTTPS is automatic.

### 6. Creating an admin in production

Two scenarios:

**Bootstrap admin (first deploy)**
- Set `ADMIN_SEED_USERNAME` and `ADMIN_SEED_PASSWORD` on the app service.
- The build's `db:seed` step creates the admin automatically.

**Promote an existing user later**
1. Either change `ADMIN_SEED_USERNAME` on the service to their username (keep a strong `ADMIN_SEED_PASSWORD`), and trigger a redeploy — `db:seed` will promote them.
2. Or, faster, open the Railway Postgres service → **Data** tab → **user** table → set their `role` to `admin`.
3. Or use `psql` against the public URL:
   ```bash
   psql '<railway-public-postgres-url>' -c "UPDATE \"user\" SET role='admin' WHERE username='someuser';"
   ```

### 7. Inspecting the Railway DB

Railway's dashboard has a **Data** tab on the Postgres service (point-and-click rows) and a **Query** tab (raw SQL). For Drizzle Studio against prod from your laptop:

```bash
# Railway → Postgres → Connect → Public Network → copy the URL
DATABASE_URL='postgresql://...railway.app:1234/railway' bun run db:studio
```

---

## Stack

- Bun (runtime)
- TanStack Start (SSR React) + Router + Query + Form
- Drizzle ORM + Postgres
- Better Auth (username + password, admin plugin)
- Tailwind v3 + custom design tokens
- @dnd-kit (kanban), Recharts (burndown)

## Security posture

- **No secrets in source.** `BETTER_AUTH_SECRET` and `ADMIN_SEED_PASSWORD` have no fallbacks — the app refuses to start without them. `.env.local` is gitignored.
- **Sessions in HTTP-only cookies** — not readable from page JS, so XSS can't steal a session.
- **CSRF**: same-site cookies + Better Auth's origin validation against `trustedOrigins`.
- **SQL injection**: all queries through Drizzle's parameterized API.
- **Server-derived user**: every server function calls `requireUser()` / `requireAdmin()` and reads the session from the cookie. Clients can't impersonate by sending a userId.
- **No password hashing in app code** — Better Auth uses scrypt internally.
