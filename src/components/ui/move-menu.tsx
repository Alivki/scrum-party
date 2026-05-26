import * as React from "react";
import { createPortal } from "react-dom";
import { ISSUE_STATUSES, STATUS_META, type IssueStatus } from "~/lib/types";
import { cn } from "~/lib/utils";

interface MoveMenuProps {
  anchor: HTMLElement | null;
  currentStatus: IssueStatus;
  onMove: (status: IssueStatus) => void;
  onClose: () => void;
}

export function MoveMenu({ anchor, currentStatus, onMove, onClose }: MoveMenuProps) {
  const [pos, setPos] = React.useState<{
    top: number;
    left: number;
    placement: "below" | "above";
  } | null>(null);

  React.useLayoutEffect(() => {
    if (!anchor) return;
    function place() {
      const rect = anchor!.getBoundingClientRect();
      const menuW = 240;
      const menuH = 320;
      const margin = 8;
      let left = rect.left;
      if (left + menuW + margin > window.innerWidth) {
        left = window.innerWidth - menuW - margin;
      }
      if (left < margin) left = margin;

      const fitsBelow = rect.bottom + menuH + margin <= window.innerHeight;
      const placement = fitsBelow ? "below" : "above";
      const top = placement === "below" ? rect.bottom + 6 : rect.top - 6 - menuH;
      setPos({ top, left, placement });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!anchor || typeof document === "undefined" || !pos) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onPointerDown={onClose}
        aria-hidden
      />
      <div
        role="menu"
        aria-label="Flytt issue til kolonne"
        className="fixed z-50 w-[240px] bg-paper border border-ink-3 rounded-xl shadow-lg py-1"
        style={{ top: pos.top, left: pos.left }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="caption-3 num px-3 pt-2 pb-1.5 border-b border-ink-3">
          flytt til
        </div>
        {ISSUE_STATUSES.map((status) => {
          const meta = STATUS_META[status];
          const isCurrent = status === currentStatus;
          return (
            <button
              key={status}
              type="button"
              role="menuitem"
              disabled={isCurrent}
              onClick={() => {
                onMove(status);
                onClose();
              }}
              className={cn(
                "w-full text-left flex items-center gap-2 px-3 py-2.5 transition-colors",
                isCurrent
                  ? "bg-paper-2 cursor-default"
                  : "hover:bg-hot-tint cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0",
                  meta.tone === "hot" && "bg-hot",
                  meta.tone === "warm" && "bg-warm",
                  meta.tone === "cool" && "bg-cobalt",
                  meta.tone === "ink" && "bg-ink",
                )}
              />
              <span className="num caption-3 mr-1">{meta.number}</span>
              <span
                className={cn(
                  "font-display text-base uppercase tracking-tight leading-none",
                  meta.tone === "hot" && "text-hot",
                )}
              >
                {meta.label}
              </span>
              {isCurrent && (
                <span className="ml-auto caption-3 text-ink-4">nå</span>
              )}
            </button>
          );
        })}
      </div>
    </>,
    document.body,
  );
}
