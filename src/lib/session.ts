import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "~/lib/auth-client";
import { getCurrentUser } from "~/lib/server-fns";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 30_000,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    await authClient.signOut();
    qc.clear();
  };
}
