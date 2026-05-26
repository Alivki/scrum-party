import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import * as React from "react";
import { BurndownChart } from "~/components/burndown-chart";
import { IssueForm } from "~/components/issue-form";
import { KanbanBoard } from "~/components/kanban-board";
import { Leaderboard } from "~/components/leaderboard";
import { Section, TopStrip } from "~/components/page-chrome";
import { ScoreboardMasthead } from "~/components/scoreboard-masthead";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  getLeaderboard,
  getSharedBurndown,
  listIssuesWithUsers,
  listUsers,
} from "~/lib/server-fns";
import { useCurrentUser } from "~/lib/session";

export const Route = createFileRoute("/party")({
  component: PartyPage,
});

function PartyPage() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    if (!me.isLoading && !me.data) navigate({ to: "/" });
  }, [me.data, me.isLoading, navigate]);

  const leaderboard = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
    refetchInterval: 10_000,
    enabled: !!me.data,
  });

  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
    refetchInterval: 30_000,
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

  const entries = leaderboard.data ?? [];
  const myEntry = entries.find((e) => e.user.id === me.data!.id);
  const isAdmin = me.data!.role === "admin";
  const visibleEntries = entries.filter((e) => e.user.role !== "admin");
  // Rank is computed against the leaderboard (non-admins). Admin viewing
  // their own row gets no rank.
  const myRank = isAdmin
    ? null
    : visibleEntries.findIndex((e) => e.user.id === me.data!.id) + 1;
  const totalUsers = visibleEntries.length;

  return (
    <main className="min-h-screen pb-16">
      <TopStrip participants={totalUsers} />

      <ScoreboardMasthead
        user={me.data}
        rank={myRank}
        pointsClosed={myEntry?.pointsClosed ?? 0}
        pointsTotal={myEntry?.pointsTotal ?? 0}
        units={myEntry?.totalAlcoholUnits ?? 0}
        promille={myEntry?.estimatedPromille ?? 0}
        linkTo={`/u/${me.data.id}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        <div className="lg:border-r lg:border-ink-3 min-w-0">
          <Section
            title="Burndown"
            right={
              <span className="caption-3 num">
                {burndown.data?.totalPoints ?? 0} pt
              </span>
            }
          >
            <BurndownChart
              series={burndown.data?.series ?? []}
              totalPoints={burndown.data?.totalPoints ?? 0}
              height={300}
            />
          </Section>
        </div>

        <aside className="border-t border-ink-3 lg:border-t-0">
          <Section title="Leaderboard" flush>
            <div className="lg:max-h-[420px] lg:overflow-y-auto">
              <Leaderboard
                entries={entries}
                currentUserId={me.data.id}
                isAdmin={isAdmin}
                onSelectHref={(id) => `/u/${id}`}
              />
            </div>
          </Section>
        </aside>
      </div>

      <Section
        title="Board"
        right={
          <Dialog open={addOpen} onOpenChange={(o) => setAddOpen(o)}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4" strokeWidth={1.75} />
                Ny issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ny issue</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <IssueForm
                  userId={me.data.id}
                  onDone={() => setAddOpen(false)}
                />
              </DialogBody>
            </DialogContent>
          </Dialog>
        }
        flush
      >
        <div className="px-5 md:px-8 pb-6 pt-3">
          <KanbanBoard
            issues={issues.data ?? []}
            currentUserId={me.data.id}
            showOwner
          />
        </div>
      </Section>
    </main>
  );
}
