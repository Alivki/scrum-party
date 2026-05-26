import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        refetchOnWindowFocus: true,
      },
    },
  });

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient },
      defaultPreload: "intent",
      scrollRestoration: true,
      defaultErrorComponent: ({ error }) => (
        <div className="p-8 text-center">
          <h1 className="text-2xl">Something exploded</h1>
          <pre className="mt-4 text-sm opacity-70">{String(error)}</pre>
        </div>
      ),
      defaultNotFoundComponent: () => (
        <div className="p-8 text-center">
          <h1 className="text-2xl">Not found</h1>
        </div>
      ),
    }),
    queryClient,
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
