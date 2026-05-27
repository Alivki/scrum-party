import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { MoveMenu } from "~/components/ui/move-menu";
import { deleteIssue, moveIssue } from "~/lib/server-fns";
import type { Issue, IssueStatus, IssueWithUser, User } from "~/lib/types";
import { ISSUE_STATUSES, STATUS_META } from "~/lib/types";
import { cn } from "~/lib/utils";

type AnyIssue = Issue | IssueWithUser;

interface Props {
  issues: AnyIssue[];
  /** id of the user who can drag/edit. If null/undefined, board is fully read-only. */
  currentUserId?: string | null;
  /** When true, show the owner avatar/name on each card (shared boards). */
  showOwner?: boolean;
  /** When true, viewer can delete any issue (not just their own). */
  isAdmin?: boolean;
  onEdit?: (issue: Issue) => void;
}

/**
 * Custom collision detection: prefer item-to-item collisions when present,
 * but fall back to the container droppable when no items are under the pointer
 * (this is what makes empty columns receivable).
 */
const droppableCollision: CollisionDetection = (args) => {
  // First try pointerWithin: works great when pointer enters an empty column.
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  // Fall back to rectIntersection for general overlap detection.
  return rectIntersection(args);
};

export function KanbanBoard({
  issues,
  currentUserId = null,
  showOwner = false,
  isAdmin = false,
  onEdit,
}: Props) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<AnyIssue | null>(null);
  const [localIssues, setLocalIssues] = React.useState(issues);

  React.useEffect(() => setLocalIssues(issues), [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const move = useMutation({
    mutationFn: (d: { id: string; status: IssueStatus; position: number }) =>
      moveIssue({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["burndown"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteIssue({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["burndown"] });
    },
  });

  const byStatus = React.useMemo(() => {
    const map: Record<IssueStatus, AnyIssue[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      review: [],
      done: [],
    };
    [...localIssues]
      .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
      .forEach((i) => map[i.status].push(i));
    return map;
  }, [localIssues]);

  function findContainer(id: string): IssueStatus | null {
    if (ISSUE_STATUSES.includes(id as IssueStatus)) return id as IssueStatus;
    return localIssues.find((i) => i.id === id)?.status ?? null;
  }

  function isOwnedByMe(id: string): boolean {
    if (!currentUserId) return false;
    const issue = localIssues.find((i) => i.id === id);
    return issue?.userId === currentUserId;
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (!isOwnedByMe(id)) return;
    setActiveId(id);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overId = String(over.id);
    if (!isOwnedByMe(activeIdStr)) return;

    const fromStatus = findContainer(activeIdStr);
    const toStatus = findContainer(overId);
    if (!fromStatus || !toStatus) return;

    let targetPosition: number;

    if (fromStatus === toStatus) {
      const colItems = byStatus[fromStatus];
      const oldIndex = colItems.findIndex((i) => i.id === activeIdStr);
      const newIndex = colItems.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(colItems, oldIndex, newIndex);
      setLocalIssues((prev) => {
        const others = prev.filter((i) => i.status !== fromStatus);
        return [
          ...others,
          ...reordered.map((it, idx) => ({ ...it, position: idx })),
        ];
      });
      targetPosition = newIndex;
    } else {
      const destItems = byStatus[toStatus];
      const overIdx = destItems.findIndex((i) => i.id === overId);
      targetPosition = overIdx === -1 ? destItems.length : overIdx;
      setLocalIssues((prev) =>
        prev.map((i) =>
          i.id === activeIdStr
            ? { ...i, status: toStatus, position: targetPosition }
            : i,
        ),
      );
    }

    move.mutate({ id: activeIdStr, status: toStatus, position: targetPosition });
  }

  function moveTo(issue: AnyIssue, status: IssueStatus) {
    if (issue.status === status) return;
    const destItems = byStatus[status];
    const targetPosition = destItems.length;
    setLocalIssues((prev) =>
      prev.map((i) =>
        i.id === issue.id ? { ...i, status, position: targetPosition } : i,
      ),
    );
    move.mutate({ id: issue.id, status, position: targetPosition });
  }

  const activeIssue = activeId
    ? localIssues.find((i) => i.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={droppableCollision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always },
      }}
      autoScroll={{
        threshold: { x: 0.1, y: 0.18 },
        acceleration: 12,
      }}
    >
      <div className="kanban-scroll">
        <div className="kanban">
          {ISSUE_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              issues={byStatus[status]}
              currentUserId={currentUserId}
              showOwner={showOwner}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onRequestDelete={(issue) => setPendingDelete(issue)}
              onMove={moveTo}
            />
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Slett issue?"
        description={
          pendingDelete ? (
            <>
              <span className="font-semibold text-ink">
                {pendingDelete.title}
              </span>{" "}
              forsvinner fra board og burndown. Kan ikke angres.
            </>
          ) : null
        }
        destructive
        confirmLabel="Slett"
        cancelLabel="Behold"
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <IssueCard
            issue={activeIssue}
            currentUserId={currentUserId}
            showOwner={showOwner}
            isAdmin={isAdmin}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function toneBar(tone: "ink" | "hot" | "warm" | "cool"): string {
  switch (tone) {
    case "hot":
      return "bg-hot";
    case "warm":
      return "bg-warm";
    case "cool":
      return "bg-cobalt";
    case "ink":
    default:
      return "bg-ink";
  }
}

function Column({
  status,
  issues,
  currentUserId,
  showOwner,
  isAdmin,
  onEdit,
  onRequestDelete,
  onMove,
}: {
  status: IssueStatus;
  issues: AnyIssue[];
  currentUserId: string | null;
  showOwner: boolean;
  isAdmin: boolean;
  onEdit?: (i: Issue) => void;
  onRequestDelete: (issue: AnyIssue) => void;
  onMove: (issue: AnyIssue, status: IssueStatus) => void;
}) {
  const meta = STATUS_META[status];
  const totalPoints = issues.reduce((s, i) => s + i.storyPoints, 0);
  const isHot = meta.tone === "hot";

  return (
    <div className="kanban-col">
      <div className="kanban-col-head">
        <div className={cn("h-[3px] w-9 mb-2 rounded-full", toneBar(meta.tone))} />
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={cn(
              "font-display text-lg md:text-xl leading-none tracking-tight",
              isHot && "text-hot",
            )}
          >
            {meta.label}
          </h3>
          <span className="num caption-3 whitespace-nowrap">
            {issues.length} · {totalPoints}pt
          </span>
        </div>
      </div>

      <ColumnBody
        status={status}
        issues={issues}
        currentUserId={currentUserId}
        showOwner={showOwner}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
        onMove={onMove}
      />
    </div>
  );
}

function ColumnBody({
  status,
  issues,
  currentUserId,
  showOwner,
  isAdmin,
  onEdit,
  onRequestDelete,
  onMove,
}: {
  status: IssueStatus;
  issues: AnyIssue[];
  currentUserId: string | null;
  showOwner: boolean;
  isAdmin: boolean;
  onEdit?: (i: Issue) => void;
  onRequestDelete: (issue: AnyIssue) => void;
  onMove: (issue: AnyIssue, status: IssueStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn("kanban-col-body", isOver && "is-over")}
    >
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {issues.length === 0 ? (
          <div className="kanban-empty">
            {currentUserId ? "dra hit" : "tom"}
          </div>
        ) : (
          <>
            {issues.map((issue) => (
              <SortableIssue
                key={issue.id}
                issue={issue}
                currentUserId={currentUserId}
                showOwner={showOwner}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onRequestDelete={onRequestDelete}
                onMove={onMove}
              />
            ))}
            <div className="kanban-drop-tail" aria-hidden />
          </>
        )}
      </SortableContext>
    </div>
  );
}

function SortableIssue({
  issue,
  currentUserId,
  showOwner,
  isAdmin,
  onEdit,
  onRequestDelete,
  onMove,
}: {
  issue: AnyIssue;
  currentUserId: string | null;
  showOwner: boolean;
  isAdmin: boolean;
  onEdit?: (i: Issue) => void;
  onRequestDelete: (issue: AnyIssue) => void;
  onMove: (issue: AnyIssue, status: IssueStatus) => void;
}) {
  const isOwn = currentUserId === issue.userId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id, disabled: !isOwn });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  const dragProps = isOwn ? { ...attributes, ...listeners } : {};

  return (
    <div ref={setNodeRef} style={style} {...dragProps}>
      <IssueCard
        issue={issue}
        currentUserId={currentUserId}
        showOwner={showOwner}
        isAdmin={isAdmin}
        onEdit={isOwn ? onEdit : undefined}
        onRequestDelete={isOwn || isAdmin ? onRequestDelete : undefined}
        onMove={isOwn ? onMove : undefined}
      />
    </div>
  );
}

function IssueCard({
  issue,
  currentUserId,
  showOwner,
  isAdmin = false,
  dragging,
  onEdit,
  onRequestDelete,
  onMove,
}: {
  issue: AnyIssue;
  currentUserId: string | null;
  showOwner: boolean;
  isAdmin?: boolean;
  dragging?: boolean;
  onEdit?: (i: Issue) => void;
  onRequestDelete?: (issue: AnyIssue) => void;
  onMove?: (issue: AnyIssue, status: IssueStatus) => void;
}) {
  const isDone = issue.status === "done";
  const isBlocked = issue.status === "blocked";
  const isOwn = currentUserId === issue.userId;
  const canEdit = isOwn && !!onEdit;
  const canDelete = (isOwn || isAdmin) && !!onRequestDelete;
  const owner: User | null =
    showOwner && "user" in issue ? (issue as IssueWithUser).user : null;
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  return (
    <div
      className={cn(
        "issue-card group px-3 py-2.5 relative",
        isOwn && "is-draggable",
        isDone && "is-done",
        dragging && "shadow-[3px_3px_0_0_var(--ink-2)] rotate-[0.4deg]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex-1 min-w-0 text-[14px] font-semibold leading-snug",
            isDone ? "line-through decoration-1 text-ink-3" : "text-ink",
          )}
        >
          {issue.title}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div
            className={cn(
              "num font-bold leading-none tabular-nums",
              isDone ? "text-ink-3" : "text-ink",
              issue.storyPoints >= 10 ? "text-xl" : "text-lg",
            )}
          >
            {issue.storyPoints}
            <span className="caption-3 num ml-0.5 text-[9px] align-baseline">
              pt
            </span>
          </div>
          {isOwn && onMove && !dragging && (
            <button
              type="button"
              aria-label="Flytt issue"
              aria-haspopup="menu"
              aria-expanded={!!menuAnchor}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
              }}
              className="p-1 -mr-1 text-ink-3 hover:text-ink hover:bg-paper-2 transition-colors"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {menuAnchor && onMove && (
        <MoveMenu
          anchor={menuAnchor}
          currentStatus={issue.status}
          onClose={() => setMenuAnchor(null)}
          onMove={(s) => onMove(issue, s)}
        />
      )}

      <div
        className={cn(
          "mt-1.5 caption-3 num normal-case tracking-normal text-[11px] font-medium text-ink-3 truncate",
          isDone && "opacity-70",
        )}
      >
        {issue.drinkName}
        <span className="opacity-60 mx-1.5">·</span>
        <span className="num">{issue.drinkSizeMl}</span>ml
        <span className="opacity-60 mx-1.5">·</span>
        <span className="num">{issue.alcoholPercent}</span>%
      </div>

      {(owner || isBlocked || canEdit || canDelete) && (
        <div className="mt-2 pt-2 border-t border-ink-3/30 flex items-center justify-between gap-2">
          {owner ? (
            <Link
              to="/u/$userId"
              params={{ userId: owner.id }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 hover:opacity-100 opacity-90 min-w-0"
            >
              <Avatar className="h-5 w-5">
                {owner.avatar ? <AvatarImage src={owner.avatar} alt="" /> : null}
                <AvatarFallback className="text-[8px]" seed={owner.id}>
                  {owner.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-ink-2 truncate">
                {owner.name}
              </span>
            </Link>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1 shrink-0">
            {isBlocked && (
              <span className="caption-3 text-cobalt text-[10px]">venter</span>
            )}
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {canEdit && onEdit && (
                  <button
                    type="button"
                    aria-label="Endre"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(issue);
                    }}
                    className="p-1 text-ink-3 hover:text-ink"
                  >
                    <Pencil className="h-3 w-3" strokeWidth={1.75} />
                  </button>
                )}
                {canDelete && onRequestDelete && (
                  <button
                    type="button"
                    aria-label="Slett"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(issue);
                    }}
                    className="p-1 text-ink-3 hover:text-hot"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
