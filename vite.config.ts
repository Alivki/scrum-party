import { defineConfig, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Bridge Better Auth into the Vite dev server. Intercepts /api/auth/*
 * before TanStack Start's router gets a chance to render the SPA 404.
 */
function authBridge(): Plugin {
  return {
    name: "scrum-party-auth-bridge",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/auth/")) return next();
        try {
          const { auth } = await server.ssrLoadModule("/src/lib/auth.server.ts");
          const url = `http://${req.headers.host ?? "localhost:3000"}${req.url}`;
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(", "));
          }
          let body: BodyInit | undefined;
          if (req.method && !["GET", "HEAD"].includes(req.method)) {
            const chunks: Buffer[] = [];
            for await (const c of req) chunks.push(c as Buffer);
            body = Buffer.concat(chunks);
          }
          const request = new Request(url, {
            method: req.method,
            headers,
            body,
          });
          const response: Response = await auth.handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          if (response.body) {
            const buf = Buffer.from(await response.arrayBuffer());
            res.end(buf);
          } else {
            res.end();
          }
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              error: "auth-bridge",
              message: e?.message ?? String(e),
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    authBridge(),
    tsconfigPaths(),
    // tanstackStart MUST come before viteReact
    tanstackStart(),
    viteReact(),
  ],
});
