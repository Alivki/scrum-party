import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { useLogout } from "~/lib/session";
import { cn } from "~/lib/utils";

interface TopStripProps {
  participants?: number;
  back?: { label: string; to: string };
  showLogout?: boolean;
}

export function TopStrip({ participants, back, showLogout = true }: TopStripProps) {
  const navigate = useNavigate();
  const logout = useLogout();
  return (
    <div className="px-5 md:px-10 py-2.5 flex items-center justify-between gap-4 border-b border-ink-3 bg-paper sticky top-0 z-30">
      <div className="caption-3 num flex items-center gap-3 min-w-0">
        {back ? (
          <Link
            to={back.to}
            className="btn btn-quiet text-ink-2 hover:text-ink !py-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="truncate">{back.label}</span>
          </Link>
        ) : (
          <span>dataingeniør · semester sluttfest</span>
        )}
      </div>
      <div className="caption-3 num flex items-center gap-3">
        {typeof participants === "number" && (
          <span className="hidden sm:inline">
            <span className="num">{participants}</span> deltakere
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 bg-hot rounded-full animate-pulse" />
          live
        </span>
        {showLogout && (
          <Button
            variant="quiet"
            size="icon"
            aria-label="Logg ut"
            onClick={async () => {
              await logout();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}

export function Section({
  title,
  subtitle,
  right,
  children,
  className,
  flush,
}: SectionProps) {
  return (
    <section className={cn("border-t border-ink-3", className)}>
      <header className="px-5 md:px-8 pt-5 pb-3 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl md:text-3xl leading-none tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="caption-3 mt-1.5 normal-case tracking-normal text-[12px] font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </header>
      <div className={cn(flush ? "" : "px-5 md:px-8 pb-6 pt-2")}>{children}</div>
    </section>
  );
}
