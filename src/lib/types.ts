export type IssueStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "review"
  | "done";

export const ISSUE_STATUSES: IssueStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
];

export interface ColumnMeta {
  number: string;
  label: string;
  note: string;
  /** key for styling: ink, hot, warm, cool */
  tone: "ink" | "hot" | "warm" | "cool";
}

export const STATUS_META: Record<IssueStatus, ColumnMeta> = {
  todo: {
    number: "01",
    label: "Backlog",
    note: "",
    tone: "ink",
  },
  in_progress: {
    number: "02",
    label: "Pågår",
    note: "",
    tone: "warm",
  },
  blocked: {
    number: "03",
    label: "Blokkert",
    note: "",
    tone: "cool",
  },
  review: {
    number: "04",
    label: "Review",
    note: "",
    tone: "cool",
  },
  done: {
    number: "05",
    label: "Ferdig",
    note: "",
    tone: "hot",
  },
};

export interface User {
  id: string;
  name: string;
  avatar: string | null;
  role: "user" | "admin";
  createdAt: number;
}

export interface Issue {
  id: string;
  userId: string;
  title: string;
  storyPoints: number;
  drinkName: string;
  drinkSizeMl: number;
  alcoholPercent: number;
  status: IssueStatus;
  position: number;
  completedAt: number | null;
  createdAt: number;
}

export interface IssueWithUser extends Issue {
  user: User;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
  isFuture: boolean;
}

export interface LeaderboardEntry {
  user: User;
  pointsClosed: number;
  pointsTotal: number;
  drinksClosed: number;
  totalAlcoholUnits: number;
  /** Estimated promille (BAC) for an average adult — fun stat, very approximate. */
  estimatedPromille: number;
}
