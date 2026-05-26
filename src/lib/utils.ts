import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string | number) {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function relativeTime(d: Date | string | number) {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Deterministic pastel/jewel colour pair from a seed (user id or username).
 * Returns CSS values for background + text that meet a casual readability bar.
 */
const AVATAR_PALETTE = [
  { bg: "oklch(0.78 0.10 30)", fg: "oklch(0.20 0.05 30)" }, // peach
  { bg: "oklch(0.78 0.10 95)", fg: "oklch(0.20 0.04 95)" }, // butter
  { bg: "oklch(0.78 0.10 160)", fg: "oklch(0.20 0.05 160)" }, // mint
  { bg: "oklch(0.78 0.10 220)", fg: "oklch(0.20 0.05 220)" }, // sky
  { bg: "oklch(0.78 0.10 290)", fg: "oklch(0.20 0.05 290)" }, // lavender
  { bg: "oklch(0.78 0.10 350)", fg: "oklch(0.20 0.05 350)" }, // rose
  { bg: "oklch(0.45 0.14 30)", fg: "oklch(0.97 0.02 30)" }, // brick
  { bg: "oklch(0.45 0.14 160)", fg: "oklch(0.97 0.02 160)" }, // forest
  { bg: "oklch(0.45 0.14 240)", fg: "oklch(0.97 0.02 240)" }, // ink-blue
  { bg: "oklch(0.45 0.14 310)", fg: "oklch(0.97 0.02 310)" }, // plum
];

export function avatarColors(seed: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]!;
}

export function calcAlcoholUnits(sizeMl: number, percent: number) {
  // grams of pure alcohol / 10 (Norwegian / EU "alkoholenheter" style)
  return Math.round((sizeMl * (percent / 100) * 0.78947) / 10 * 10) / 10;
}

/**
 * Story points are derived from the actual alcohol load.
 *
 * 1 standard "alkoholenhet" = 10 g pure alcohol
 *   = ~ a small pils 0.33L 4.7%   (1.22 units → 3 pts)
 *   = ~ a wine glass 175ml 12%    (1.66 units → 5 pts)
 *   = ~ a shot 40ml 40%           (1.26 units → 3 pts)
 *   = ~ a 0.5L pils 4.7%          (1.85 units → 5 pts)
 *   = ~ an energy + vodka 250/12% (2.37 units → 6 pts)
 *   = ~ a liter of strong pils 7% (5.53 units → 15 pts, capped)
 *
 * Linear scaling at 2.7 pts per unit, clamped to [0, 15].
 * Water and other 0% beverages return 0 points.
 */
/**
 * Estimate blood-alcohol promille for an average adult who consumed `drinks`
 * (each {sizeMl, percent, atMs}) starting at `firstMs`.
 *
 * Uses the Widmark formula at average proxies (75 kg, r-factor 0.7,
 * elimination β ≈ 0.15‰/h). Returns a non-negative promille value.
 *
 * Note: deeply inaccurate per-person — the user asked for "average person".
 */
export function estimatedPromille(
  drinks: { sizeMl: number; percent: number; atMs: number }[],
  nowMs: number = Date.now(),
  opts?: { weightKg?: number; r?: number; beta?: number },
): number {
  if (drinks.length === 0) return 0;
  const weightKg = opts?.weightKg ?? 75;
  const r = opts?.r ?? 0.7;
  const beta = opts?.beta ?? 0.15;
  const firstMs = Math.min(...drinks.map((d) => d.atMs));
  const elapsedHours = Math.max(0, (nowMs - firstMs) / 3_600_000);
  const totalGrams = drinks.reduce(
    (g, d) => g + d.sizeMl * (d.percent / 100) * 0.78947,
    0,
  );
  const peak = totalGrams / (weightKg * r);
  const promille = peak - beta * elapsedHours;
  return Math.max(0, Math.round(promille * 100) / 100);
}

export function calcStoryPoints(sizeMl: number, percent: number) {
  if (!Number.isFinite(sizeMl) || !Number.isFinite(percent)) return 0;
  if (sizeMl <= 0 || percent <= 0) return 0;
  const units = calcAlcoholUnits(sizeMl, percent);
  return Math.max(0, Math.min(15, Math.round(units * 2.7)));
}
