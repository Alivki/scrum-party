import { Link } from "@tanstack/react-router";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Stamp } from "~/components/ui/stamp";
import type { User } from "~/lib/types";
import { cn } from "~/lib/utils";

interface ScoreboardMastheadProps {
  user: User;
  rank: number | null;
  pointsClosed: number;
  pointsTotal: number;
  units: number;
  promille: number;
  /** If set, wraps the identity block in a Link to this URL. */
  linkTo?: string;
}

export function ScoreboardMasthead({
  user,
  rank,
  pointsClosed,
  pointsTotal,
  units,
  promille,
  linkTo,
}: ScoreboardMastheadProps) {
  const pct =
    pointsTotal > 0 ? Math.min(100, (pointsClosed / pointsTotal) * 100) : 0;
  const isLeader = rank === 1;

  const identity = (
    <>
      <div className="relative shrink-0">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
          {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
          <AvatarFallback className="text-2xl md:text-3xl" seed={user.id}>
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isLeader && (
          <Stamp className="absolute -top-3 -right-4 !text-[10px] !py-1 !px-1.5">
            01
          </Stamp>
        )}
      </div>
      <div className="min-w-0">
        <h1
          className={cn(
            "font-display text-4xl sm:text-5xl md:text-[64px] uppercase leading-none tracking-tight truncate",
            linkTo && "group-hover:text-hot transition-colors",
          )}
        >
          {user.name}
        </h1>
        {user.role === "admin" && (
          <div className="mt-2">
            <span className="caption-3 inline-flex items-center gap-1 rounded-full bg-ink text-paper px-2 py-0.5 text-[10px] tracking-wider">
              admin
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <header className="border-b border-ink-3">
      <div className="px-5 md:px-10 py-5 grid gap-5 md:gap-6 grid-cols-1 lg:grid-cols-[1fr_auto] items-center">
        {linkTo ? (
          <Link
            to={linkTo}
            className="group flex items-center gap-4 md:gap-5 min-w-0"
          >
            {identity}
          </Link>
        ) : (
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
            {identity}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:border-l lg:border-ink-3 lg:pl-6 lg:min-w-[520px] gap-y-4 sm:gap-y-0">
          <Stat label="Rangering" hot={isLeader}>
            <div className="num font-bold leading-none text-2xl md:text-4xl tabular-nums">
              {rank ? String(rank).padStart(2, "0") : "—"}
            </div>
          </Stat>
          <Stat
            label="Story points"
            divided
            note={
              pointsTotal > 0
                ? `${Math.round(pct)}% lukket`
                : "ingen issues"
            }
          >
            <div className="leading-none">
              <span className="num font-bold text-2xl md:text-4xl tabular-nums text-hot">
                {pointsClosed}
              </span>
              <span className="num font-bold text-base md:text-lg text-ink-3 tabular-nums">
                /{pointsTotal}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-paper-2 rounded-full relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-hot rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </Stat>
          <Stat label="Enheter" divided>
            <div className="num font-bold leading-none text-2xl md:text-4xl tabular-nums">
              {units.toFixed(1)}
            </div>
          </Stat>
          <Stat label="Promille" divided note={promilleNote(promille)}>
            <div
              className={cn(
                "num font-bold leading-none text-2xl md:text-4xl tabular-nums",
                promille >= 1 ? "text-hot" : "text-ink",
              )}
            >
              {promille.toFixed(2)}
              <span className="text-base md:text-xl text-ink-3 ml-0.5">‰</span>
            </div>
          </Stat>
        </div>
      </div>
    </header>
  );
}

function promilleNote(p: number): string {
  if (p === 0) return "edru";
  if (p < 0.3) return "knapt målbart";
  if (p < 0.6) return "varm";
  if (p < 1.0) return "klar promille";
  if (p < 1.5) return "betydelig";
  if (p < 2.0) return "kraftig påvirket";
  return "alvorlig";
}

function Stat({
  label,
  divided,
  hot,
  note,
  children,
}: {
  label: string;
  divided?: boolean;
  hot?: boolean;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col px-3 md:px-5 first:pl-0 lg:first:pl-0",
        divided && "border-l border-ink-3",
      )}
    >
      <div className={cn("caption-3 mb-2", hot && "text-hot")}>{label}</div>
      <div className="flex-1 min-h-0">{children}</div>
      {note && (
        <div className="caption-3 num mt-2 normal-case tracking-normal text-[10px]">
          {note}
        </div>
      )}
    </div>
  );
}
