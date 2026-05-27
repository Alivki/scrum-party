import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Maximize2, Minimize2, X } from "lucide-react";
import * as React from "react";
import { BurndownChart } from "~/components/burndown-chart";
import { KanbanBoard } from "~/components/kanban-board";
import { Leaderboard } from "~/components/leaderboard";
import { Button } from "~/components/ui/button";
import {
  getLeaderboard,
  getSharedBurndown,
  listIssuesWithUsers,
} from "~/lib/server-fns";
import { useCurrentUser } from "~/lib/session";

export const Route = createFileRoute("/felles")({
  component: FellesPage,
});

function FellesPage() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = React.useState(false);

  React.useEffect(() => {
    if (!me.isLoading && !me.data) navigate({ to: "/" });
  }, [me.data, me.isLoading, navigate]);

  React.useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const leaderboard = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
    refetchInterval: 10_000,
    enabled: !!me.data,
  });
  const issues = useQuery({
    queryKey: ["issues", "all-with-users"],
    queryFn: () => listIssuesWithUsers(),
    refetchInterval: 8_000,
    enabled: !!me.data,
  });
  const burndown = useQuery({
    queryKey: ["burndown", "shared"],
    queryFn: () => getSharedBurndown(),
    refetchInterval: 10_000,
    enabled: !!me.data,
  });

  if (!me.data) {
    return (
      <div className="min-h-screen grid place-items-center caption-3">
        laster…
      </div>
    );
  }

  const visibleEntries = (leaderboard.data ?? []).filter(
    (e) => e.user.role !== "admin",
  );

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (rootRef.current?.requestFullscreen) {
      await rootRef.current.requestFullscreen();
    }
  }

  return (
    <div
      ref={rootRef}
      className="bg-paper h-screen w-screen overflow-hidden flex flex-col"
    >
      <header className="px-4 md:px-6 py-2 flex items-center justify-between gap-3 border-b border-ink-3 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="font-display text-xl md:text-2xl leading-none tracking-tight">
            Felles
          </h1>
          <span className="caption-3 num flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 bg-hot rounded-full animate-pulse" />
            live
          </span>
          <span className="caption-3 num hidden sm:inline">
            <span className="num">{visibleEntries.length}</span> deltakere
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="quiet"
            size="icon"
            aria-label={isFull ? "Avslutt fullskjerm" : "Fullskjerm"}
            onClick={toggleFullscreen}
          >
            {isFull ? (
              <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
            )}
          </Button>
          <Link to="/party" aria-label="Lukk">
            <Button variant="quiet" size="icon" aria-label="Lukk">
              <X className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_26rem] min-h-0">
          <section className="border-b lg:border-b-0 lg:border-r border-ink-3 min-w-0 flex flex-col min-h-0">
            <div className="px-4 pt-2 pb-1 flex items-baseline justify-between">
              <h2 className="font-display text-lg md:text-xl tracking-tight">
                Burndown
              </h2>
              <span className="caption-3 num">
                {burndown.data?.totalPoints ?? 0} pt
              </span>
            </div>
            <div className="flex-1 min-h-0 px-2 pb-2">
           <BurndownChart
  series={burndown.data?.series ?? []}
  totalPoints={burndown.data?.totalPoints ?? 0}
  partyStart={burndown.data?.partyStart}
  partyEnd={burndown.data?.partyEnd}
  height="100%"
/>

            </div>
          </section>
          <aside className="min-h-0 flex flex-col">
            <div className="px-4 pt-2 pb-1">
              <h2 className="font-display text-lg md:text-xl tracking-tight">
                Leaderboard
              </h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <Leaderboard
                entries={leaderboard.data ?? []}
                currentUserId={me.data.id}
                onSelectHref={(id) => `/u/${id}`}
              />
            </div>
          </aside>
        </div>

        <section className="border-t border-ink-3 min-h-0 flex flex-col">
          <div className="px-4 pt-2 pb-1">
            <h2 className="font-display text-lg md:text-xl tracking-tight">
              Board
            </h2>
          </div>
          <div className="felles-board flex-1 min-h-0 px-3 pb-3 overflow-hidden">
            <KanbanBoard
              issues={issues.data ?? []}
              currentUserId={null}
              showOwner
            />
          </div>
        </section>
      </div>
    </div>
  );
}
