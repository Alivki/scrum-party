import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusCircle, Save } from "lucide-react";
import * as React from "react";
import { BurndownChart } from "~/components/burndown-chart";
import { IssueForm } from "~/components/issue-form";
import { KanbanBoard } from "~/components/kanban-board";
import { Section, TopStrip } from "~/components/page-chrome";
import { PhotoCapture } from "~/components/photo-capture";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  getBurndown,
  getLeaderboard,
  getUser,
  listIssues,
  updateProfile,
} from "~/lib/server-fns";
import { useCurrentUser } from "~/lib/session";
import type { Issue, User } from "~/lib/types";

export const Route = createFileRoute("/u/$userId")({
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();
  const me = useCurrentUser();
  const navigate = useNavigate();
  const [editing, setEditing] = React.useState<Issue | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!me.isLoading && !me.data) navigate({ to: "/" });
  }, [me.data, me.isLoading, navigate]);

  const user = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser({ data: { id: userId } }),
    enabled: !!me.data,
  });

  const issues = useQuery({
    queryKey: ["issues", userId],
    queryFn: () => listIssues({ data: { userId } }),
    refetchInterval: 8_000,
    enabled: !!me.data,
  });

  const burndown = useQuery({
    queryKey: ["burndown", userId],
    queryFn: () => getBurndown({ data: { userId } }),
    refetchInterval: 10_000,
    enabled: !!me.data,
  });

  const leaderboard = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
    refetchInterval: 15_000,
    enabled: !!me.data,
  });

  const u = user.data;
  const isMe = me.data?.id === userId;
  const entry = leaderboard.data?.find((e) => e.user.id === userId);
  // Rank is computed against the non-admin field. Admins have no rank.
  const rank = leaderboard.data
    ? u?.role === "admin"
      ? null
      : leaderboard.data
          .filter((e) => e.user.role !== "admin")
          .findIndex((e) => e.user.id === userId) + 1
    : null;

  if (!me.data) {
    return (
      <div className="min-h-screen grid place-items-center caption-3">
        laster…
      </div>
    );
  }

  if (user.isLoading) {
    return (
      <main className="min-h-screen">
        <TopStrip back={{ label: "Tilbake til felles", to: "/party" }} />
        <div className="p-10 caption-3">laster…</div>
      </main>
    );
  }

  if (!u) {
    return (
      <main className="min-h-screen">
        <TopStrip back={{ label: "Tilbake til felles", to: "/party" }} />
        <div className="p-10">
          <h1 className="font-display text-3xl">Fant ikke deltaker.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <TopStrip back={{ label: "Tilbake til felles", to: "/party" }} />

      <ScoreboardMasthead
        user={u}
        rank={rank}
        pointsClosed={entry?.pointsClosed ?? 0}
        pointsTotal={entry?.pointsTotal ?? 0}
        units={entry?.totalAlcoholUnits ?? 0}
        promille={entry?.estimatedPromille ?? 0}
        onEdit={isMe ? () => setProfileOpen(true) : undefined}
      />

      {isMe && (
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rediger profil</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <ProfileForm
                initial={u}
                onDone={() => setProfileOpen(false)}
              />
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}

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
          height={280}
        />
      </Section>

      <Section
        title="Board"
        right={
          isMe ? (
            <Dialog
              open={addOpen || !!editing}
              onOpenChange={(o) => {
                if (!o) {
                  setAddOpen(false);
                  setEditing(null);
                } else {
                  setAddOpen(true);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <PlusCircle className="h-4 w-4" strokeWidth={1.75} />
                  Ny issue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Endre issue" : "Ny issue"}
                  </DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <IssueForm
                    userId={me.data.id}
                    initial={editing ?? undefined}
                    onDone={() => {
                      setAddOpen(false);
                      setEditing(null);
                    }}
                  />
                </DialogBody>
              </DialogContent>
            </Dialog>
          ) : null
        }
        flush
      >
        <div className="px-5 md:px-8 pb-6 pt-3">
          <KanbanBoard
            issues={issues.data ?? []}
            currentUserId={isMe ? me.data.id : null}
            isAdmin={me.data.role === "admin"}
            onEdit={isMe ? (i) => setEditing(i) : undefined}
          />
        </div>
      </Section>
    </main>
  );
}

function ProfileForm({
  initial,
  onDone,
}: {
  initial: User;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const save = useMutation({
    mutationFn: (d: { name: string; avatar: string | null }) =>
      updateProfile({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUser"] });
      qc.invalidateQueries({ queryKey: ["user", initial.id] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  const form = useForm({
    defaultValues: {
      name: initial.name,
      avatar: initial.avatar,
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      if (!name) return;
      setError(null);
      try {
        await save.mutateAsync({ name, avatar: value.avatar });
        onDone?.();
      } catch (e: any) {
        setError(e?.message ?? "Klarte ikke å lagre.");
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
      noValidate
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            !value.trim()
              ? undefined
              : value.trim().length > 40
                ? "Maks 40 tegn."
                : undefined,
        }}
        children={(field) => (
          <div>
            <Label htmlFor={field.name}>Brukernavn</Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="navn"
              maxLength={40}
              autoFocus
            />
            {field.state.meta.errors[0] && (
              <p className="text-xs text-hot mt-2 font-mono">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      <form.Field
        name="avatar"
        children={(field) => (
          <form.Subscribe
            selector={(s) => s.values.name}
            children={(name) => (
              <PhotoCapture
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                fallbackInitials={
                  name?.trim()
                    ? name.trim().slice(0, 2).toUpperCase()
                    : initial.name.slice(0, 2).toUpperCase()
                }
              />
            )}
          />
        )}
      />

      {error && (
        <p
          role="alert"
          className="text-xs text-hot font-mono leading-tight bg-hot-tint/40 rounded-lg px-3 py-2 whitespace-pre-wrap"
        >
          {error}
        </p>
      )}

      <form.Subscribe
        selector={(s) =>
          [s.canSubmit, s.isSubmitting, s.values.name] as const
        }
        children={([canSubmit, isSubmitting, name]) => (
          <Button
            type="submit"
            className="w-full"
            disabled={
              !canSubmit || !name.trim() || isSubmitting || save.isPending
            }
          >
            <Save className="h-4 w-4" strokeWidth={1.75} />
            {isSubmitting || save.isPending ? "Lagrer…" : "Lagre"}
          </Button>
        )}
      />
    </form>
  );
}
