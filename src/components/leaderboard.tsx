import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Stamp } from "~/components/ui/stamp";
import { deleteUser } from "~/lib/server-fns";
import type { LeaderboardEntry } from "~/lib/types";
import { cn } from "~/lib/utils";

interface Props {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isAdmin?: boolean;
  /** Builds the URL for a row click. */
  onSelectHref: (userId: string) => string;
}

export function Leaderboard({
  entries,
  currentUserId,
  isAdmin,
  onSelectHref,
}: Props) {
  const qc = useQueryClient();
  const [pendingDelete, setPendingDelete] = React.useState<
    LeaderboardEntry | null
  >(null);

  const remove = useMutation({
    mutationFn: (id: string) => deleteUser({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["burndown"] });
    },
  });

  const visible = entries.filter((e) => e.user.role !== "admin");

  if (visible.length === 0) {
    return (
      <div className="px-5 py-10 text-center caption-3">
        ingen deltakere
      </div>
    );
  }

  return (
    <>
      <div role="table" aria-label="Leaderboard">
        <ol>
          {visible.map((e, idx) => {
            const rank = idx + 1;
            const isMe = e.user.id === currentUserId;
            const href = onSelectHref(e.user.id);
            return (
              <li
                key={e.user.id}
                role="row"
                className={cn(
                  "relative group border-b border-ink-3/40 transition-colors",
                  "hover:bg-paper-2",
                  isMe && "bg-hot-tint/60 hover:bg-hot-tint",
                )}
              >
                <Link
                  to={href}
                  className="w-full grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 sm:px-5 py-3 text-left"
                >
                  <div className="flex items-center">
                    {rank === 1 ? (
                      <Stamp className="!text-xs !py-1 !px-1.5">01</Stamp>
                    ) : (
                      <span className="num font-bold text-lg sm:text-xl text-ink">
                        {String(rank).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      {e.user.avatar ? (
                        <AvatarImage src={e.user.avatar} alt="" />
                      ) : null}
                      <AvatarFallback className="text-xs" seed={e.user.id}>
                        {e.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-display text-base sm:text-lg uppercase leading-none truncate tracking-tight">
                        {e.user.name}
                      </div>
                      <div className="caption-3 mt-1 truncate normal-case tracking-normal text-[11px] font-medium text-ink-3">
                        <span className="num">{e.drinksClosed}</span> drinks
                        <span className="mx-1">·</span>
                        <span className="num">
                          {e.estimatedPromille.toFixed(2)}
                        </span>
                        ‰
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "num text-right font-bold leading-none tabular-nums pr-2",
                      rank === 1
                        ? "text-hot text-3xl"
                        : "text-ink text-2xl sm:text-3xl",
                    )}
                  >
                    {e.pointsClosed}
                  </span>
                </Link>
                {isAdmin && !isMe && (
                  <button
                    type="button"
                    aria-label={`Slett ${e.user.name}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      setPendingDelete(e);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-ink-3 hover:text-hot hover:bg-paper opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Slett deltaker?"
        description={
          pendingDelete ? (
            <>
              <span className="font-semibold text-ink">
                {pendingDelete.user.name}
              </span>{" "}
              og alle issues forsvinner. Kan ikke angres.
            </>
          ) : null
        }
        destructive
        confirmLabel="Slett"
        cancelLabel="Behold"
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.user.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
