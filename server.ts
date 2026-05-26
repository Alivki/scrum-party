/// <reference types="bun-types" />
import { join } from "node:path";
import ssrApp from "./dist/server/server.js";
import { auth } from "./src/lib/auth.server";

const PORT = Number(process.env.PORT ?? 3000);
const CLIENT_DIR = join(import.meta.dir, "dist", "client");

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // 1. Better Auth handler
    if (url.pathname.startsWith("/api/auth/")) {
      return auth.handler(req);
    }

    // 2. Static assets from the client build
    if (url.pathname.startsWith("/assets/") || url.pathname === "/favicon.ico") {
      const filePath = join(CLIENT_DIR, url.pathname);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 3. Everything else: SSR.
    return (ssrApp as { fetch: (req: Request) => Promise<Response> }).fetch(req);
  },
});

console.log(`scrum-party // listening http://localhost:${server.port}`);
